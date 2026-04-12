/**
 * @module commands/discover
 *
 * CLI handler for `ptah discover` — Detect cross-repository contracts.
 *
 * Loads all registered repo profiles, runs the contract discovery engine,
 * updates project state with discovered contracts, and optionally generates
 * a `CONTRACTS.md` summary file.
 */

import { 
  readProjectState, 
  writeProjectState, 
  listRepoProfiles,
  findProject
} from '../lib/state.js';
import { getPtahHome, getProjectDir } from '../lib/paths.js';
import { discoverContracts } from '../lib/ecosystem/discovery.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

/**
 * Entry point for the `ptah discover` CLI command.
 *
 * Loads repo profiles, runs contract discovery, persists results to
 * project state, and optionally generates a CONTRACTS.md file with
 * the `--generate` flag.
 *
 * @param args - CLI arguments after the `discover` subcommand.
 */
export async function runDiscover(args: string[]): Promise<void> {
  const ptahHome = getPtahHome();
  const shouldGenerate = args.includes('--generate');
  
  let projectName: string | undefined = args.find(a => !a.startsWith('--'));
  if (!projectName) {
    projectName = findProject(ptahHome) ?? undefined;
  }

  if (!projectName) {
    console.error('Error: Project name is required or could not be determined.');
    console.error('Usage: ptah discover <project-name> [--generate]');
    return;
  }

  console.log(`\nDiscovering contracts for project '${projectName}'...\n`);

  try {
    const profiles = listRepoProfiles(projectName, ptahHome);
    if (profiles.length === 0) {
      console.log('No registered repositories found in this project.');
      console.log('Use ptah:register <path> --role <role> to add repositories.');
      return;
    }

    const contracts = discoverContracts(profiles);

    const currentState = readProjectState(projectName, ptahHome);
    const updatedState = {
      ...currentState,
      lifecycle: 'discovering' as const,
      contracts_discovered: contracts.length,
      contracts: contracts,
    };
    writeProjectState(projectName, updatedState, ptahHome);

    if (contracts.length === 0) {
      console.log('No cross-repo contracts discovered.');
    } else {
      console.log(`Discovered ${contracts.length} potential contracts:\n`);
      console.log('  Provider             Consumer             Type                 Confidence');
      console.log('  ────────────────────────────────────────────────────────────────────────');

      for (const c of contracts) {
        const provider = c.provider.padEnd(20);
        const consumer = c.consumer.padEnd(20);
        const type = c.type.padEnd(20);
        const confidence = c.confidence.toFixed(2);
        console.log(`  ${provider} ${consumer} ${type} ${confidence}`);
      }

      if (shouldGenerate) {
        updateContractsFile(projectName, updatedState.contracts, ptahHome);
        console.log(`\n✓ Generated CONTRACTS.md for project '${projectName}'`);
      }

      console.log(`\nProject state updated. Use ptah status for details.`);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
  }
}

/**
 * Generate or update the `CONTRACTS.md` file for a project.
 *
 * Uses the template from `templates/CONTRACTS.md`, populates it with
 * the project name, timestamp, and a formatted table of contracts.
 *
 * @param projectName - Name of the project.
 * @param contracts - Array of discovered contracts to render.
 * @param ptahHome - Optional Ptah home directory override.
 */
function updateContractsFile(projectName: string, contracts: any[], ptahHome?: string): void {
  const projectDir = getProjectDir(projectName, ptahHome);
  const templatePath = join(TEMPLATES_DIR, 'CONTRACTS.md');
  const outputPath = join(projectDir, 'CONTRACTS.md');

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  let template = readFileSync(templatePath, 'utf-8');
  
  const contractRows = contracts.length > 0 
    ? contracts.map(c => `| ${c.provider} | ${c.consumer} | ${c.type} | ${c.confidence.toFixed(2)} | ${c.confirmed ? '✓' : '?'} |`).join('\n')
    : '| - | - | - | - | - |';

  const content = template
    .replace('{{projectName}}', projectName)
    .replace('{{generatedAt}}', new Date().toLocaleString())
    .replace('{{contractRows}}', contractRows);

  writeFileSync(outputPath, content);
}
