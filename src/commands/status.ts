/**
 * @module commands/status
 *
 * CLI handler for `ptah status` — Display workspace lifecycle and execution progress.
 *
 * Reads `STATE.json` and the active plan (if any) to present a formatted
 * overview of the project's current state, including lifecycle stage,
 * task progress, and wave position.
 */

import {
  readProjectState,
  findProject,
  readPlan,
  listRepoProfiles,
} from '../lib/state.js';
import type { Plan } from '../lib/schemas.js';

/**
 * CLI handler for `ptah status`.
 *
 * Displays:
 * - Current lifecycle stage
 * - Registered repository count
 * - Active plan summary (if any)
 * - Task completion and failure counts
 * - Current execution wave
 *
 * @param args - CLI arguments (may include `--project <name>`).
 */
export async function runStatus(args: string[]): Promise<void> {
  // Resolve project
  const idx = args.indexOf('--project');
  let projectName: string | null = null;

  if (idx !== -1 && args[idx + 1]) {
    projectName = args[idx + 1];
  } else {
    projectName = findProject();
  }

  if (!projectName) {
    console.error('No project found. Use --project <name> or ensure exactly one project exists.');
    process.exit(1);
  }

  const state = readProjectState(projectName);
  const repos = listRepoProfiles(projectName);

  // Header
  console.log('');
  console.log(`  ┌─────────────────────────────────────┐`);
  console.log(`  │       ptah — Project Status          │`);
  console.log(`  └─────────────────────────────────────┘`);
  console.log('');

  // Lifecycle
  const lifecycleEmoji: Record<string, string> = {
    idle: '⏸',
    learning: '📖',
    discovering: '🔍',
    planning: '📋',
    planned: '✅',
    executing: '⚡',
    verifying: '🔬',
    complete: '🎉',
  };

  const emoji = lifecycleEmoji[state.lifecycle] ?? '•';
  console.log(`  ${emoji}  Lifecycle:  ${state.lifecycle.toUpperCase()}`);
  console.log(`  📦  Project:    ${projectName}`);
  console.log(`  🗂   Repos:      ${repos.length} registered`);

  if (state.contracts_discovered > 0) {
    console.log(`  🔗  Contracts:  ${state.contracts_discovered} discovered`);
  }

  // Plan info
  if (state.current_plan) {
    console.log('');
    console.log(`  ── Active Plan ──────────────────────`);
    console.log(`  Plan ID:  ${state.current_plan}`);

    try {
      const plan: Plan = readPlan(projectName, state.current_plan);
      const completed = plan.tasks.filter((t) => t.status === 'completed').length;
      const failed = plan.tasks.filter((t) => t.status === 'failed').length;
      const running = plan.tasks.filter((t) => t.status === 'running').length;
      const pending = plan.tasks.filter((t) => t.status === 'pending').length;
      const total = plan.tasks.length;

      console.log(`  Status:   ${plan.status}`);
      console.log(`  Tasks:    ${completed}/${total} completed${failed > 0 ? `, ${failed} failed` : ''}${running > 0 ? `, ${running} running` : ''}`);
      console.log(`  Pending:  ${pending}`);
      console.log(`  Waves:    ${plan.waves} total, currently on wave ${state.tasks.current_wave || 'N/A'}`);
    } catch {
      console.log(`  (Could not read plan details)`);
    }
  } else {
    console.log('');
    console.log(`  No active plan.`);
  }

  // Last session
  if (state.last_session) {
    console.log('');
    console.log(`  Last session: ${state.last_session}`);
  }

  console.log('');
}
