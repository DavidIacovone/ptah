/**
 * @module commands/lifecycle
 *
 * CLI handlers for Ptah lifecycle management.
 *
 * Provides escape-hatch commands for managing the project lifecycle
 * state machine when it gets stuck or needs manual intervention.
 *
 * Commands:
 * - `ptah reset-state` — Reset lifecycle to `idle` (escape hatch)
 *
 * Lifecycle stage validation logic is also exported as a utility
 * function for other commands to enforce valid transitions.
 */

import {
  readProjectState,
  updateProjectState,
  findProject,
} from '../lib/state.js';
import type { Lifecycle } from '../lib/schemas.js';

// ── Lifecycle Validation ───────────────────────────────────────

/**
 * Valid lifecycle transitions for each command category.
 *
 * Maps command groups to the set of lifecycle stages from which
 * they are allowed to execute.
 */
const VALID_STAGES: Record<string, Lifecycle[]> = {
  register: ['idle'],
  learn: ['idle'],
  discover: ['idle'],
  plan: ['idle', 'complete'],
  execute: ['planned', 'executing'],
  verify: ['executing', 'verifying'],
};

/**
 * Check whether a command is allowed to run in the current lifecycle stage.
 *
 * @param commandGroup - The command category (e.g. `"plan"`, `"execute"`).
 * @param currentStage - The project's current lifecycle stage.
 * @returns `true` if allowed, throws descriptive error if not.
 * @throws If the current stage is not valid for the command.
 */
export function enforceLifecycle(commandGroup: string, currentStage: Lifecycle): void {
  const allowed = VALID_STAGES[commandGroup];
  if (!allowed) {
    // No restrictions defined for this command group
    return;
  }

  if (!allowed.includes(currentStage)) {
    throw new Error(
      `Cannot run "${commandGroup}" in "${currentStage}" stage. ` +
      `Allowed stages: ${allowed.join(', ')}. ` +
      `Use "ptah reset-state" to return to idle if stuck.`
    );
  }
}

// ── reset-state ────────────────────────────────────────────────

/**
 * CLI handler for `ptah reset-state`.
 *
 * Unconditionally resets the project lifecycle to `idle`, providing
 * an escape hatch when the project gets stuck in an intermediate
 * state (e.g. after a crashed execution or failed verification).
 *
 * The active plan is preserved but its status context is cleared.
 * Task statuses within the plan are NOT modified — use this to
 * re-attempt execution from a clean lifecycle state.
 *
 * @param args - CLI arguments (may include `--project <name>`).
 */
export async function runResetState(args: string[]): Promise<void> {
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
  const previousStage = state.lifecycle;

  updateProjectState(projectName, {
    lifecycle: 'idle',
    tasks: {
      total: 0,
      completed: 0,
      failed: 0,
      current_wave: 0,
    },
  });

  console.log(`✓ Lifecycle reset: ${previousStage} → idle`);
  console.log(`  Project "${projectName}" is now in idle state.`);
  console.log(`  Active plan preserved (if any). Run "ptah plan" to create a new plan.`);
}
