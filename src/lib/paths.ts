import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const DEFAULT_PTAH_HOME = join(homedir(), '.ptah');
const GLOBAL_CONFIG_FILE = 'config.json';

/**
 * Resolve the Ptah home directory.
 * Priority: PTAH_HOME env var → global config override → default (~/.ptah)
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

export function getProjectsDir(ptahHome?: string): string {
  return join(ptahHome ?? getPtahHome(), 'projects');
}

export function getProjectDir(projectName: string, ptahHome?: string): string {
  return join(getProjectsDir(ptahHome), projectName);
}

export function getGlobalConfigPath(ptahHome?: string): string {
  return join(ptahHome ?? getPtahHome(), GLOBAL_CONFIG_FILE);
}
