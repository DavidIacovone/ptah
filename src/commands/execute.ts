/**
 * @module commands/execute
 *
 * CLI handlers for Ptah execution state management.
 *
 * These commands are designed to be called by AI orchestration skills
 * (e.g. `ptah:execute`) to drive wave-based cross-repo execution.
 * Each command reads/writes `STATE.json` and the active plan file,
 * outputting structured JSON so the AI can parse results reliably.
 *
 * Commands:
 * - `ptah next-task`     — Get the next actionable task in the current wave
 * - `ptah complete-task` — Mark a task done, collect git diff
 * - `ptah fail-task`     — Mark a task as failed with an error message
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  readProjectState,
  updateProjectState,
  readPlan,
  writePlan,
  findProject,
  listRepoProfiles,
} from '../lib/state.js';
import { getProjectDir } from '../lib/paths.js';
import type { Plan, Task } from '../lib/schemas.js';

// ── Helpers ────────────────────────────────────────────────────

/**
 * Resolve the active project name — auto-detect if only one exists.
 *
 * @param args - CLI args; looks for `--project <name>`.
 * @returns The resolved project name.
 * @throws If no project can be determined.
 */
function resolveProject(args: string[]): string {
  const idx = args.indexOf('--project');
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }

  const detected = findProject();
  if (!detected) {
    throw new Error('Cannot determine project. Use --project <name> or ensure exactly one project exists.');
  }
  return detected;
}

/**
 * Find the filesystem path for a repo referenced by a task.
 *
 * Looks up the repo name in registered repo profiles to get the absolute path.
 *
 * @param projectName - Active Ptah project.
 * @param repoName - Repository name from the task.
 * @returns Absolute path to the repository root, or `null` if not found.
 */
function resolveRepoPath(projectName: string, repoName: string): string | null {
  const profiles = listRepoProfiles(projectName);
  const match = profiles.find((p) => p.name === repoName);
  return match?.path ?? null;
}

/**
 * Check whether any task that depends on a failed task exists in future waves.
 *
 * @param plan - The current plan.
 * @param failedTaskIds - Set of failed task IDs.
 * @returns Array of task IDs blocked by failures.
 */
function findBlockedTasks(plan: Plan, failedTaskIds: Set<string>): string[] {
  const blocked: string[] = [];
  for (const task of plan.tasks) {
    if (task.status === 'pending' || task.status === 'running') {
      const hasFailedDep = task.depends_on.some((dep) => failedTaskIds.has(dep));
      if (hasFailedDep) {
        blocked.push(task.id);
      }
    }
  }
  return blocked;
}

// ── next-task ──────────────────────────────────────────────────

/**
 * CLI handler for `ptah next-task`.
 *
 * Returns JSON describing the next actionable task in the current wave.
 * Possible JSON statuses:
 * - `"task"` — a task is ready; includes task details
 * - `"waiting_on_parallel"` — tasks in current wave are still running
 * - `"wave_complete"` — current wave finished, advanced to next
 * - `"plan_complete"` — all tasks finished
 * - `"blocked"` — remaining tasks depend on failed tasks
 *
 * @param args - CLI arguments (may include `--project <name>`).
 */
export async function runNextTask(args: string[]): Promise<void> {
  const projectName = resolveProject(args);
  const state = readProjectState(projectName);

  if (!state.current_plan) {
    console.log(JSON.stringify({ status: 'error', message: 'No active plan. Run ptah plan first.' }));
    process.exit(1);
  }

  const plan = readPlan(projectName, state.current_plan);

  // Initialize current_wave if not started
  let currentWave = state.tasks.current_wave;
  if (currentWave === 0) {
    currentWave = 1;
    updateProjectState(projectName, {
      lifecycle: 'executing',
      tasks: { ...state.tasks, current_wave: 1 },
    });
  }

  // Collect failed task IDs for dependency checking
  const failedTaskIds = new Set(
    plan.tasks.filter((t) => t.status === 'failed').map((t) => t.id)
  );

  // Find tasks in current wave
  const waveTasks = plan.tasks.filter((t) => t.wave === currentWave);
  const pending = waveTasks.filter((t) => t.status === 'pending');
  const running = waveTasks.filter((t) => t.status === 'running');

  if (pending.length > 0) {
    // Pick first pending task that isn't blocked by failures
    const unblocked = pending.filter(
      (t) => !t.depends_on.some((dep) => failedTaskIds.has(dep))
    );

    if (unblocked.length === 0) {
      console.log(JSON.stringify({
        status: 'blocked',
        message: `All pending tasks in wave ${currentWave} depend on failed tasks.`,
        failed_tasks: Array.from(failedTaskIds),
      }));
      return;
    }

    const task = unblocked[0];

    // Mark as running
    const taskIndex = plan.tasks.findIndex((t) => t.id === task.id);
    plan.tasks[taskIndex] = { ...task, status: 'running' };
    writePlan(projectName, plan);

    // Resolve repo path
    const repoPath = resolveRepoPath(projectName, task.repo);

    console.log(JSON.stringify({
      status: 'task',
      task: {
        id: task.id,
        repo: task.repo,
        repo_path: repoPath,
        description: task.description,
        wave: task.wave,
        depends_on: task.depends_on,
      },
    }));
    return;
  }

  if (running.length > 0) {
    console.log(JSON.stringify({
      status: 'waiting_on_parallel',
      message: `${running.length} task(s) still running in wave ${currentWave}.`,
      running_tasks: running.map((t) => t.id),
    }));
    return;
  }

  // All tasks in current wave are done — try to advance
  const maxWave = Math.max(...plan.tasks.map((t) => t.wave));

  if (currentWave >= maxWave) {
    // Check if there are any remaining pending/running tasks
    const remaining = plan.tasks.filter((t) => t.status === 'pending' || t.status === 'running');
    if (remaining.length === 0) {
      console.log(JSON.stringify({
        status: 'plan_complete',
        message: 'All tasks in the plan are finished.',
        completed: plan.tasks.filter((t) => t.status === 'completed').length,
        failed: plan.tasks.filter((t) => t.status === 'failed').length,
        total: plan.tasks.length,
      }));
      return;
    }
  }

  // Advance wave
  const nextWave = currentWave + 1;

  // Check if next wave is blocked
  const nextWaveTasks = plan.tasks.filter((t) => t.wave === nextWave);
  const blocked = findBlockedTasks(plan, failedTaskIds);
  const nextWaveBlocked = nextWaveTasks.filter((t) => blocked.includes(t.id));

  if (nextWaveBlocked.length === nextWaveTasks.length && nextWaveTasks.length > 0) {
    console.log(JSON.stringify({
      status: 'blocked',
      message: `All tasks in wave ${nextWave} are blocked by failed dependencies.`,
      blocked_tasks: nextWaveBlocked.map((t) => t.id),
      failed_tasks: Array.from(failedTaskIds),
    }));
    return;
  }

  // Update current wave
  updateProjectState(projectName, {
    tasks: { ...state.tasks, current_wave: nextWave },
  });

  console.log(JSON.stringify({
    status: 'wave_complete',
    message: `Wave ${currentWave} complete. Advanced to wave ${nextWave}.`,
    previous_wave: currentWave,
    next_wave: nextWave,
  }));
}

// ── complete-task ──────────────────────────────────────────────

/**
 * CLI handler for `ptah complete-task <id>`.
 *
 * Marks a task as completed, collects a git diff from the task's repo,
 * saves it to `~/.ptah/projects/<name>/diffs/<id>.diff`, and updates
 * progress counters.
 *
 * @param args - CLI arguments: `<task-id> [--project <name>]`.
 */
export async function runCompleteTask(args: string[]): Promise<void> {
  const projectName = resolveProject(args);
  // Task ID is the first non-flag argument
  const taskId = args.find((a) => !a.startsWith('--') && a !== args[args.indexOf('--project') + 1]);

  if (!taskId) {
    console.log(JSON.stringify({ status: 'error', message: 'Usage: ptah complete-task <task-id>' }));
    process.exit(1);
  }

  const state = readProjectState(projectName);
  if (!state.current_plan) {
    console.log(JSON.stringify({ status: 'error', message: 'No active plan.' }));
    process.exit(1);
  }

  const plan = readPlan(projectName, state.current_plan);
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    console.log(JSON.stringify({ status: 'error', message: `Task "${taskId}" not found in plan.` }));
    process.exit(1);
  }

  const task = plan.tasks[taskIndex];

  // Resolve repo path for diff collection
  const repoPath = resolveRepoPath(projectName, task.repo);
  let diffContent = 'No diff detected — task marked complete without changes.';

  if (repoPath && existsSync(repoPath)) {
    try {
      const raw = execSync('git diff HEAD', {
        cwd: repoPath,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB max
        timeout: 30000,
      });
      if (raw.trim()) {
        diffContent = raw;
      }
    } catch {
      // git diff failed — not fatal, just record empty diff
      diffContent = 'git diff failed — repo may not be a git repository.';
    }
  }

  // Save diff to file
  const projectDir = getProjectDir(projectName);
  const diffsDir = join(projectDir, 'diffs');
  mkdirSync(diffsDir, { recursive: true });

  const diffPath = join(diffsDir, `${taskId}.diff`);
  writeFileSync(diffPath, diffContent, 'utf-8');

  // Update plan task status
  plan.tasks[taskIndex] = {
    ...task,
    status: 'completed',
    diff: diffPath,
  };
  writePlan(projectName, plan);

  // Update state progress
  updateProjectState(projectName, {
    tasks: {
      ...state.tasks,
      completed: state.tasks.completed + 1,
    },
  });

  console.log(JSON.stringify({
    status: 'completed',
    task_id: taskId,
    diff_path: diffPath,
    message: `Task "${taskId}" marked complete. Diff saved.`,
  }));
}

// ── fail-task ──────────────────────────────────────────────────

/**
 * CLI handler for `ptah fail-task <id> <message>`.
 *
 * Marks a task as failed with the provided error message.
 * Downstream tasks that depend on this one will be blocked by `next-task`.
 *
 * @param args - CLI arguments: `<task-id> <error-message> [--project <name>]`.
 */
export async function runFailTask(args: string[]): Promise<void> {
  const projectName = resolveProject(args);

  // Parse: first non-flag arg = task ID, rest = error message
  const nonFlags: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project') {
      i++; // skip value
      continue;
    }
    if (!args[i].startsWith('--')) {
      nonFlags.push(args[i]);
    }
  }

  const taskId = nonFlags[0];
  const errorMsg = nonFlags.slice(1).join(' ') || 'Unknown error';

  if (!taskId) {
    console.log(JSON.stringify({ status: 'error', message: 'Usage: ptah fail-task <task-id> <message>' }));
    process.exit(1);
  }

  const state = readProjectState(projectName);
  if (!state.current_plan) {
    console.log(JSON.stringify({ status: 'error', message: 'No active plan.' }));
    process.exit(1);
  }

  const plan = readPlan(projectName, state.current_plan);
  const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    console.log(JSON.stringify({ status: 'error', message: `Task "${taskId}" not found in plan.` }));
    process.exit(1);
  }

  // Mark failed
  plan.tasks[taskIndex] = {
    ...plan.tasks[taskIndex],
    status: 'failed',
    error: errorMsg,
  };
  writePlan(projectName, plan);

  // Update state
  updateProjectState(projectName, {
    tasks: {
      ...state.tasks,
      failed: state.tasks.failed + 1,
    },
  });

  console.log(JSON.stringify({
    status: 'failed',
    task_id: taskId,
    error: errorMsg,
    message: `Task "${taskId}" marked as failed.`,
  }));
}
