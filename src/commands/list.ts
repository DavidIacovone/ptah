/**
 * @module commands/list
 *
 * CLI handler for `ptah list` — List all configured Ptah projects.
 *
 * Reads `~/.ptah/projects/` and displays each project's name,
 * CLI tool preference, permission mode, and lifecycle status.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getPtahHome, getProjectsDir } from '../lib/paths.js';

/**
 * Entry point for the `ptah list` CLI command.
 *
 * Scans the projects directory and displays a formatted table with
 * each project's name, CLI tool, mode, and lifecycle status.
 *
 * @param _args - CLI arguments (currently unused).
 */
export async function runList(_args: string[]): Promise<void> {
  const ptahHome = getPtahHome();
  const projectsDir = getProjectsDir(ptahHome);

  if (!existsSync(projectsDir)) {
    console.log('No Ptah projects found.');
    console.log('Create one with: ptah init <project-name>');
    return;
  }

  const entries = readdirSync(projectsDir).filter((entry) => {
    const entryPath = join(projectsDir, entry);
    return statSync(entryPath).isDirectory() && existsSync(join(entryPath, 'config.json'));
  });

  if (entries.length === 0) {
    console.log('No Ptah projects found.');
    console.log('Create one with: ptah init <project-name>');
    return;
  }

  console.log(`\nPtah projects (${entries.length}):\n`);
  console.log('  Name                 CLI Tool       Mode       Status');
  console.log('  ────────────────────────────────────────────────────────');

  for (const name of entries) {
    const projectDir = join(projectsDir, name);
    try {
      const config = JSON.parse(readFileSync(join(projectDir, 'config.json'), 'utf-8'));
      const state = existsSync(join(projectDir, 'STATE.json'))
        ? JSON.parse(readFileSync(join(projectDir, 'STATE.json'), 'utf-8'))
        : { lifecycle: 'unknown' };

      const displayName = name.padEnd(20);
      const tool = (config.cli_tool ?? 'unknown').padEnd(14);
      const mode = (config.mode ?? 'unknown').padEnd(10);
      const lifecycle = state.lifecycle ?? 'unknown';

      console.log(`  ${displayName} ${tool} ${mode} ${lifecycle}`);
    } catch {
      console.log(`  ${name.padEnd(20)} (error reading config)`);
    }
  }

  console.log(`\n  Location: ${projectsDir}\n`);
}
