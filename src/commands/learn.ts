/**
 * ptah learn — Deeply analyze registered repositories
 *
 * Scans each registered repo for framework, language, key directories,
 * and public exports. Updates the RepoProfile files.
 */

import { listRepoProfiles, writeRepoProfile, updateProjectState, findProject } from '../lib/state.js';
import { scanRepo, extractExports } from '../lib/ecosystem/scanner.js';

interface LearnOptions {
  project: string | null;
}

function parseLearnArgs(args: string[]): LearnOptions {
  let project: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--project' && args[i + 1]) {
      project = args[++i];
    }
  }

  return { project };
}

export async function runLearn(args: string[]): Promise<void> {
  const { project: explicitProject } = parseLearnArgs(args);

  const projectName = explicitProject ?? findProject();
  if (!projectName) {
    console.error('Error: Could not determine project. Use --project <name> or ensure only one project exists.');
    process.exit(1);
  }

  const profiles = listRepoProfiles(projectName);
  if (profiles.length === 0) {
    console.log(`No repositories registered in project "${projectName}".`);
    console.log('Register one with: ptah register <path>');
    return;
  }

  console.log(`\nLearning project: ${projectName}`);
  console.log(`Scanning ${profiles.length} repositories...\n`);

  updateProjectState(projectName, { lifecycle: 'learning' });

  for (const profile of profiles) {
    console.log(`  → Analyzing ${profile.name}...`);
    try {
      const scanResult = await scanRepo(profile.path);
      const exports_summary = extractExports(profile.path);

      const updatedProfile = {
        ...profile,
        framework: scanResult.framework ?? profile.framework,
        language: scanResult.language ?? profile.language,
        key_directories: scanResult.key_directories,
        exports_summary,
        learned_at: new Date().toISOString(),
      };

      writeRepoProfile(projectName, updatedProfile);
      console.log(`    ✓ ${updatedProfile.framework ?? 'No framework'} | ${updatedProfile.language ?? 'No language'}`);
    } catch (error) {
      console.error(`    ✗ Failed to scan ${profile.name}:`, error instanceof Error ? error.message : String(error));
    }
  }

  updateProjectState(projectName, { lifecycle: 'idle' });

  console.log(`\n✓ Learning complete. Repo profiles updated in projects/${projectName}/repos/`);
}
