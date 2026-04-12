/**
 * @module commands/verify
 *
 * CLI handlers for Ptah verification workflows.
 *
 * These commands support the AI `ptah:verify` skill by providing structured
 * data about completed tasks, their diffs, and the ability to finalize
 * the verification stage.
 *
 * Commands:
 * - `ptah verify-manifest` — Dump JSON manifest of tasks and diff paths
 * - `ptah mark-verified`   — Transition lifecycle to `complete`
 * - `ptah verify-local`    — Stub for local test execution (v2)
 */

import { existsSync, statSync } from 'node:fs';
import {
  readProjectState,
  updateProjectState,
  readPlan,
  writePlan,
  findProject,
} from '../lib/state.js';

// ── Helpers ────────────────────────────────────────────────────

/**
 * Resolve the active project name.
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

// ── verify-manifest ────────────────────────────────────────────

/**
 * CLI handler for `ptah verify-manifest`.
 *
 * Outputs a JSON manifest listing every task in the active plan along with:
 * - Task ID, description, repo
 * - Path to the collected diff file
 * - Whether the diff file exists and has content
 * - Task status (completed, failed, pending)
 *
 * The `ptah:verify` skill reads this manifest to dispatch reviewer subagents.
 *
 * @param args - CLI arguments (may include `--project <name>`).
 */
export async function runVerifyManifest(args: string[]): Promise<void> {
  const projectName = resolveProject(args);
  const state = readProjectState(projectName);

  // Must be in executing or verifying stage
  const validStages = ['executing', 'verifying', 'complete'];
  if (!validStages.includes(state.lifecycle)) {
    console.log(JSON.stringify({
      status: 'error',
      message: `Cannot verify in "${state.lifecycle}" stage. Must be executing, verifying, or complete.`,
    }));
    process.exit(1);
  }

  if (!state.current_plan) {
    console.log(JSON.stringify({ status: 'error', message: 'No active plan.' }));
    process.exit(1);
  }

  const plan = readPlan(projectName, state.current_plan);

  let missingDiffs = false;
  const tasks = plan.tasks.map((task) => {
    const diffPath = task.diff;
    let diffExists = false;
    let diffHasContents = false;

    if (diffPath && existsSync(diffPath)) {
      diffExists = true;
      try {
        const stats = statSync(diffPath);
        diffHasContents = stats.size > 0;
      } catch {
        // stat failed — treat as empty
      }
    }

    if (task.status === 'completed' && !diffExists) {
      missingDiffs = true;
    }

    return {
      id: task.id,
      repo: task.repo,
      description: task.description,
      status: task.status,
      wave: task.wave,
      diff_path: diffPath,
      diff_exists: diffExists,
      diff_has_contents: diffHasContents,
      error: task.error,
    };
  });

  // Transition to verifying if still in executing
  if (state.lifecycle === 'executing') {
    updateProjectState(projectName, { lifecycle: 'verifying' });
  }

  console.log(JSON.stringify({
    status: 'manifest',
    plan_id: plan.id,
    plan_description: plan.description,
    plan_status: plan.status,
    missing_diffs: missingDiffs,
    tasks,
  }, null, 2));
}

// ── mark-verified ──────────────────────────────────────────────

/**
 * CLI handler for `ptah mark-verified`.
 *
 * Transitions the project lifecycle to `complete` and marks the active
 * plan as `completed`. Called after the `ptah:verify` skill confirms
 * all acceptance criteria are met.
 *
 * @param args - CLI arguments (may include `--project <name>`).
 */
export async function runMarkVerified(args: string[]): Promise<void> {
  const projectName = resolveProject(args);
  const state = readProjectState(projectName);

  if (!state.current_plan) {
    console.log(JSON.stringify({ status: 'error', message: 'No active plan to verify.' }));
    process.exit(1);
  }

  // Update plan status
  const plan = readPlan(projectName, state.current_plan);
  plan.status = 'completed';
  writePlan(projectName, plan);

  // Update lifecycle
  updateProjectState(projectName, {
    lifecycle: 'complete',
  });

  console.log(JSON.stringify({
    status: 'verified',
    plan_id: plan.id,
    message: `Plan "${plan.id}" verified. Lifecycle set to complete.`,
  }));
}

// ── verify-local ───────────────────────────────────────────────

/**
 * CLI handler for `ptah verify-local`.
 *
 * Stub for running local repository tests (npm test, cargo test, etc.)
 * on repos affected by the current plan. Full implementation deferred to v2.
 *
 * @param args - CLI arguments (may include `--project <name>`).
 */
export async function runVerifyLocal(args: string[]): Promise<void> {
  const projectName = resolveProject(args);
  const state = readProjectState(projectName);

  if (!state.current_plan) {
    console.log('No active plan — nothing to verify locally.');
    return;
  }

  console.log(`[ptah verify-local] Stub — local test passthrough for project "${projectName}".`);
  console.log('Full local test execution will be implemented in a future release.');
  console.log('For now, use ptah:verify to run AI-driven acceptance criteria checks.');
}
