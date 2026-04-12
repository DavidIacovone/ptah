/**
 * @module commands/build-dag
 *
 * CLI handler for `ptah build-dag` — Assign dependency-aware waves to plan tasks.
 *
 * Reads the specified plan (or the current plan from project state), loads
 * any confirmed cross-repo contracts, runs Kahn's topological sort to
 * assign wave numbers, and persists the updated plan.
 *
 * @example
 * ```bash
 * ptah build-dag my-project --plan plan-1712345678
 * ```
 */

import {
  readProjectState,
  writeProjectState,
  readPlan,
  writePlan,
  findProject,
} from '../lib/state.js';
import { getPtahHome } from '../lib/paths.js';
import { assignWaves } from '../lib/ecosystem/dag.js';

/**
 * Entry point for the `ptah build-dag` CLI command.
 *
 * Reads a plan's tasks, runs the DAG builder to assign parallel execution
 * waves, updates the plan with wave numbers, and displays a grouped summary.
 *
 * @param args - CLI arguments after the `build-dag` subcommand.
 */
export async function runBuildDag(args: string[]): Promise<void> {
  const ptahHome = getPtahHome();

  // Parse arguments
  let projectName: string | null = null;
  let planId: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plan' && args[i + 1]) {
      planId = args[++i];
    } else if (!args[i].startsWith('--')) {
      projectName = args[i];
    }
  }

  // Resolve project
  if (!projectName) {
    projectName = findProject(ptahHome) ?? null;
  }

  if (!projectName) {
    console.error('Error: Project name is required or could not be determined.');
    console.error('Usage: ptah build-dag <project-name> [--plan <plan-id>]');
    return;
  }

  try {
    // If no plan specified, use current_plan from state
    if (!planId) {
      const state = readProjectState(projectName, ptahHome);
      planId = state.current_plan;
      if (!planId) {
        console.error(
          'Error: No --plan specified and no current plan in project state.'
        );
        console.error('Create a plan first with: ptah plan <project-name> --description "..." --tasks \'[...]\'');
        return;
      }
    }

    console.log(`\nBuilding DAG for plan '${planId}' in project '${projectName}'...\n`);

    // Read the plan
    const plan = readPlan(projectName, planId, ptahHome);

    if (plan.tasks.length === 0) {
      console.log('Plan has no tasks. Nothing to sort.');
      return;
    }

    // Load contracts for implicit dependency enrichment
    const state = readProjectState(projectName, ptahHome);
    const contracts = state.contracts ?? [];

    // Run DAG builder
    const result = assignWaves(plan.tasks, contracts);

    if (!result.isValid) {
      console.error(`Error: ${result.error}`);
      console.error(
        'Fix circular dependencies in your task depends_on fields and retry.'
      );
      return;
    }

    // Update the plan with wave assignments
    const updatedPlan = {
      ...plan,
      tasks: result.tasks,
      waves: result.totalWaves,
    };

    writePlan(projectName, updatedPlan, ptahHome);

    // Update state lifecycle
    const updatedState = {
      ...state,
      lifecycle: 'planned' as const,
      tasks: {
        ...state.tasks,
        total: result.tasks.length,
        current_wave: 0,
      },
      last_session: new Date().toISOString(),
    };
    writeProjectState(projectName, updatedState, ptahHome);

    // Display summary
    console.log(`✓ DAG built successfully`);
    console.log(`  Total tasks: ${result.tasks.length}`);
    console.log(`  Total waves: ${result.totalWaves}`);
    console.log('');

    for (let wave = 1; wave <= result.totalWaves; wave++) {
      const ids = result.waveMap[wave] ?? [];
      console.log(`  Wave ${wave} (${ids.length} task${ids.length !== 1 ? 's' : ''}):`);
      for (const id of ids) {
        const task = result.tasks.find((t) => t.id === id);
        if (task) {
          const deps =
            task.depends_on.length > 0
              ? ` ← depends on: ${task.depends_on.join(', ')}`
              : '';
          console.log(`    ${task.id}: ${task.description} [${task.repo}]${deps}`);
        }
      }
    }

    console.log('');
    console.log('Plan updated with wave assignments. Ready for execution.');
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
  }
}
