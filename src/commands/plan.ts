/**
 * ptah plan — Create a task plan for cross-repo changes.
 *
 * Logic:
 * 1. Find a Ptah project.
 * 2. Accept --description and --tasks (JSON) arguments.
 * 3. Validate tasks reference only registered repositories.
 * 4. Persist the plan to the filesystem using writePlan.
 * 5. Update lifecycle in STATE.json.
 * 6. Display the created plan summary.
 */

import {
  readProjectState,
  writeProjectState,
  writePlan,
  listRepoProfiles,
  findProject,
} from '../lib/state.js';
import { getPtahHome } from '../lib/paths.js';
import { PlanSchema, type Task } from '../lib/schemas.js';
import { randomUUID } from 'node:crypto';

export async function runPlan(args: string[]): Promise<void> {
  const ptahHome = getPtahHome();

  // Parse arguments
  let projectName: string | null = null;
  let description = '';
  let tasksJson = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--description' && args[i + 1]) {
      description = args[++i];
    } else if (args[i] === '--tasks' && args[i + 1]) {
      tasksJson = args[++i];
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
    console.error('Usage: ptah plan <project-name> --description "..." --tasks \'[...]\'');
    return;
  }

  if (!description) {
    console.error('Error: --description is required.');
    console.error('Usage: ptah plan <project-name> --description "..." --tasks \'[...]\'');
    return;
  }

  if (!tasksJson) {
    console.error('Error: --tasks is required (JSON array of task objects).');
    console.error('Example: --tasks \'[{"id":"t1","repo":"backend","description":"Add user field"}]\'');
    return;
  }

  console.log(`\nCreating plan for project '${projectName}'...\n`);

  try {
    // Parse tasks JSON
    let rawTasks: unknown[];
    try {
      rawTasks = JSON.parse(tasksJson);
      if (!Array.isArray(rawTasks)) {
        throw new Error('Tasks must be a JSON array');
      }
    } catch (err) {
      console.error(`Error: Invalid --tasks JSON: ${(err as Error).message}`);
      return;
    }

    // Load registered repos for validation
    const profiles = listRepoProfiles(projectName, ptahHome);
    const registeredRepoNames = new Set(profiles.map((p) => p.name));

    // Validate each task references a registered repo
    const tasks: Task[] = [];
    for (const raw of rawTasks) {
      const task = raw as Record<string, unknown>;

      if (!task.id || !task.repo || !task.description) {
        console.error('Error: Each task must have "id", "repo", and "description" fields.');
        return;
      }

      const repoName = task.repo as string;
      if (registeredRepoNames.size > 0 && !registeredRepoNames.has(repoName)) {
        console.error(
          `Error: Task "${task.id}" references unregistered repo "${repoName}".`
        );
        console.error(
          `Registered repos: ${[...registeredRepoNames].join(', ') || '(none)'}`
        );
        console.error('Register repos first with: ptah register <path> --role <role>');
        return;
      }

      tasks.push({
        id: task.id as string,
        repo: repoName,
        description: task.description as string,
        status: 'pending',
        wave: (task.wave as number) ?? 1,
        depends_on: (task.depends_on as string[]) ?? [],
        diff: null,
        error: null,
      });
    }

    // Create plan object
    const planId = `plan-${Date.now()}`;
    const plan = PlanSchema.parse({
      id: planId,
      description,
      created_at: new Date().toISOString(),
      status: 'draft',
      tasks,
      waves: Math.max(...tasks.map((t) => t.wave), 0),
    });

    // Persist the plan
    writePlan(projectName, plan, ptahHome);

    // Update project state
    const currentState = readProjectState(projectName, ptahHome);
    const updatedState = {
      ...currentState,
      lifecycle: 'planned' as const,
      current_plan: planId,
      tasks: {
        total: tasks.length,
        completed: 0,
        failed: 0,
        current_wave: 0,
      },
      last_session: new Date().toISOString(),
    };
    writeProjectState(projectName, updatedState, ptahHome);

    // Display summary
    console.log(`✓ Plan created: ${planId}`);
    console.log(`  Description: ${description}`);
    console.log(`  Tasks: ${tasks.length}`);
    console.log(`  Waves: ${plan.waves}`);
    console.log('');
    console.log('  Tasks:');
    for (const task of tasks) {
      const deps = task.depends_on.length > 0 ? ` (depends on: ${task.depends_on.join(', ')})` : '';
      console.log(`    [Wave ${task.wave}] ${task.id}: ${task.description} → ${task.repo}${deps}`);
    }
    console.log('');
    console.log(`Project state updated to 'planned'. Use ptah:execute to begin execution.`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
  }
}
