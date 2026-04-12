/**
 * @module paths
 *
 * Filesystem path resolution for Ptah's data directory (`~/.ptah`).
 *
 * Ptah stores all project data under a single home directory. By default this
 * is `~/.ptah`, but it can be overridden via:
 *
 * 1. The `PTAH_HOME` environment variable (highest priority)
 * 2. The `ptah_home` field in `~/.ptah/config.json`
 * 3. The default `~/.ptah` path (lowest priority)
 *
 * Directory layout:
 * ```
 * ~/.ptah/
 * ├── config.json            ← global config
 * └── projects/
 *     └── <project-name>/
 *         ├── config.json    ← project config
 *         ├── STATE.json     ← lifecycle state
 *         ├── repos/         ← repo profiles
 *         ├── plans/         ← task plans
 *         └── logs/          ← execution logs
 * ```
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

/** Default Ptah home directory (`~/.ptah`). */
const DEFAULT_PTAH_HOME = join(homedir(), '.ptah');

/** Filename for the global configuration file. */
const GLOBAL_CONFIG_FILE = 'config.json';

/**
 * Resolve the Ptah home directory.
 *
 * Checks, in order:
 * 1. `PTAH_HOME` environment variable
 * 2. `ptah_home` override in `~/.ptah/config.json`
 * 3. Default `~/.ptah`
 *
 * @returns Absolute path to the Ptah home directory.
 */
export function getPtahHome(): string {
  if (process.env.PTAH_HOME) {
    return process.env.PTAH_HOME;
  }

  const defaultConfigPath = join(DEFAULT_PTAH_HOME, GLOBAL_CONFIG_FILE);
  if (existsSync(defaultConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(defaultConfigPath, 'utf-8'));
      if (config.ptah_home && config.ptah_home !== DEFAULT_PTAH_HOME) {
        return config.ptah_home;
      }
    } catch {
      // Fall through to default
    }
  }

  return DEFAULT_PTAH_HOME;
}

/**
 * Get the directory that contains all Ptah projects.
 *
 * @param ptahHome - Optional override for the Ptah home directory.
 * @returns Absolute path to `<ptahHome>/projects/`.
 */
export function getProjectsDir(ptahHome?: string): string {
  return join(ptahHome ?? getPtahHome(), 'projects');
}

/**
 * Get the directory for a specific Ptah project.
 *
 * @param projectName - Name of the project (directory basename).
 * @param ptahHome - Optional override for the Ptah home directory.
 * @returns Absolute path to `<ptahHome>/projects/<projectName>/`.
 */
export function getProjectDir(projectName: string, ptahHome?: string): string {
  return join(getProjectsDir(ptahHome), projectName);
}

/**
 * Get the path to the global configuration file.
 *
 * @param ptahHome - Optional override for the Ptah home directory.
 * @returns Absolute path to `<ptahHome>/config.json`.
 */
export function getGlobalConfigPath(ptahHome?: string): string {
  return join(ptahHome ?? getPtahHome(), GLOBAL_CONFIG_FILE);
}
