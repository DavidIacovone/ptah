/**
 * @module commands/check-permission
 *
 * CLI handler for `ptah check-permission <action>`.
 *
 * Checks the effective permission level for a given action against
 * the active project's configuration. Returns structured JSON so
 * AI skill instructions can parse and act on the result.
 *
 * Exit codes:
 * - 0: `auto`    — action proceeds without confirmation
 * - 2: `confirm` — user must confirm before proceeding
 * - 1: `deny`    — action is blocked (also used for errors)
 */

import { PERMISSION_ACTION_MAP, ProjectConfigSchema } from '../lib/schemas.js';
import { findProject, readProjectConfig } from '../lib/state.js';

/**
 * Check the permission level for a specific action.
 *
 * Resolves the active project, loads its config, and maps the action
 * to a permission tier (read/write/destructive), then returns the
 * configured permission level for that tier.
 *
 * When `mode` is `auto-accept`, all actions return `auto` regardless
 * of per-tier settings.
 *
 * @param args - CLI arguments: `[action]`
 */
export async function runCheckPermission(args: string[]): Promise<void> {
  const action = args[0];

  // Validate action exists in the map
  if (!action || !(action in PERMISSION_ACTION_MAP)) {
    console.log(JSON.stringify({
      error: 'unknown_action',
      action: action || null,
      known_actions: Object.keys(PERMISSION_ACTION_MAP),
    }));
    process.exit(1);
  }

  // Resolve active project
  const projectName = findProject();
  if (!projectName) {
    console.log(JSON.stringify({
      error: 'no_project',
      message: 'No active project found. Run ptah init first.',
    }));
    process.exit(1);
  }

  // Load and parse project config
  let config;
  try {
    config = readProjectConfig(projectName);
  } catch (err) {
    console.log(JSON.stringify({
      error: 'config_read_failed',
      message: err instanceof Error ? err.message : String(err),
    }));
    process.exit(1);
  }

  // Determine effective permission level
  const category = PERMISSION_ACTION_MAP[action];

  // auto-accept mode overrides all per-tier settings
  if (config.mode === 'auto-accept') {
    console.log(JSON.stringify({
      action,
      category,
      level: 'auto',
      reason: 'mode_override',
    }));
    process.exit(0);
  }

  // Safe mode — check per-tier permissions
  const level = config.permissions[category];

  console.log(JSON.stringify({
    action,
    category,
    level,
  }));

  // Exit codes: 0=auto, 2=confirm, 1=deny
  switch (level) {
    case 'auto':
      process.exit(0);
      break;
    case 'confirm':
      process.exit(2);
      break;
    case 'deny':
      process.exit(1);
      break;
  }
}
