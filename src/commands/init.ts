/**
 * @module commands/init
 *
 * CLI handler for `ptah init` — Create a new Ptah project.
 *
 * Creates a project directory under `~/.ptah/projects/<name>/` with
 * configuration, state tracking, ecosystem documentation, and empty
 * subdirectories for repos, plans, and logs.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPtahHome, getProjectDir, getProjectsDir, getGlobalConfigPath } from '../lib/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

/**
 * Read the Ptah CLI version from package.json.
 *
 * @returns Semver version string (defaults to `"0.1.0"` if unreadable).
 */
function getVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version ?? '0.1.0';
  } catch {
    return '0.1.0';
  }
}

/** Parsed arguments for the `ptah init` command. */
interface InitOptions {
  name: string | null;
  location: string | null;
  cliTool: string;
  maxTokens: number;
  mode: string;
}

/**
 * Parse CLI arguments into structured init options.
 *
 * @param args - Raw CLI arguments after `ptah init`.
 * @returns Parsed options with defaults applied.
 */
function parseInitArgs(args: string[]): InitOptions {
  let name: string | null = null;
  let location: string | null = null;
  let cliTool = 'gemini-cli';
  let maxTokens = 200000;
  let mode = 'safe';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--location' && args[i + 1]) {
      location = resolve(args[++i]);
    } else if (arg === '--cli-tool' && args[i + 1]) {
      cliTool = args[++i];
    } else if (arg === '--max-tokens' && args[i + 1]) {
      maxTokens = parseInt(args[++i], 10);
    } else if (arg === '--mode' && args[i + 1]) {
      mode = args[++i];
    } else if (!arg.startsWith('--') && !name) {
      name = arg;
    }
  }

  return { name, location, cliTool, maxTokens, mode };
}

/**
 * Entry point for the `ptah init` CLI command.
 *
 * Validates the project name, creates the directory structure under
 * `~/.ptah/projects/<name>/`, copies templates, and displays next steps.
 *
 * @param args - CLI arguments after the `init` subcommand.
 */
export async function runInit(args: string[]): Promise<void> {
  const { name, location, cliTool, maxTokens, mode } = parseInitArgs(args);

  if (!name) {
    console.error('Error: Project name is required.');
    console.error('Usage: ptah init <project-name> [--location <path>] [--cli-tool <tool>]');
    process.exit(1);
  }

  // Validate project name
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(name)) {
    console.error(
      `Error: Invalid project name "${name}". Use alphanumeric characters, hyphens, dots, and underscores.`
    );
    process.exit(1);
  }

  // Validate cli_tool
  const validTools = ['gemini-cli', 'claude-code'];
  if (!validTools.includes(cliTool)) {
    console.error(`Error: Invalid CLI tool "${cliTool}". Must be one of: ${validTools.join(', ')}`);
    process.exit(1);
  }

  // Validate mode
  const validModes = ['safe', 'auto-accept'];
  if (!validModes.includes(mode)) {
    console.error(`Error: Invalid mode "${mode}". Must be one of: ${validModes.join(', ')}`);
    process.exit(1);
  }

  // Determine ptah home
  const ptahHome = location ?? getPtahHome();

  // Ensure global .ptah/ and projects/ directories exist
  const projectsDir = getProjectsDir(ptahHome);
  mkdirSync(projectsDir, { recursive: true });

  // Ensure global config exists
  const globalConfigPath = getGlobalConfigPath(ptahHome);
  if (!existsSync(globalConfigPath)) {
    const globalConfig = {
      default_cli_tool: cliTool,
      ptah_home: ptahHome,
      ptah_install_path: join(__dirname, '..'),
    };
    writeFileSync(globalConfigPath, JSON.stringify(globalConfig, null, 2));
  }

  // Check if project already exists
  const projectDir = getProjectDir(name, ptahHome);
  if (existsSync(projectDir)) {
    console.error(`Error: Project "${name}" already exists at ${projectDir}`);
    process.exit(1);
  }

  // Create project directory structure
  mkdirSync(join(projectDir, 'repos'), { recursive: true });
  mkdirSync(join(projectDir, 'plans', 'current', 'tasks'), { recursive: true });
  mkdirSync(join(projectDir, 'plans', 'archive'), { recursive: true });
  mkdirSync(join(projectDir, 'logs'), { recursive: true });

  // Copy and customize config template
  const configTemplate = JSON.parse(readFileSync(join(TEMPLATES_DIR, 'config.json'), 'utf-8'));
  configTemplate.cli_tool = cliTool;
  configTemplate.max_tokens = maxTokens;
  configTemplate.mode = mode;
  configTemplate.created_at = new Date().toISOString();
  configTemplate.ptah_version = getVersion();
  writeFileSync(join(projectDir, 'config.json'), JSON.stringify(configTemplate, null, 2));

  // Copy STATE.json template
  copyFileSync(join(TEMPLATES_DIR, 'STATE.json'), join(projectDir, 'STATE.json'));

  // Copy and customize ECOSYSTEM.md template
  let ecosystem = readFileSync(join(TEMPLATES_DIR, 'ECOSYSTEM.md'), 'utf-8');
  ecosystem = ecosystem.replace('{{PROJECT_NAME}}', name);
  ecosystem = ecosystem.replace('{{CREATED_AT}}', new Date().toISOString().split('T')[0]);
  writeFileSync(join(projectDir, 'ECOSYSTEM.md'), ecosystem);

  // Install skill templates for AI tool discovery
  const skillTemplatesDir = join(TEMPLATES_DIR, 'skills');
  const projectSkillsDir = join(projectDir, 'skills');
  if (existsSync(skillTemplatesDir)) {
    const skillFiles = readdirSync(skillTemplatesDir).filter((f: string) => f.endsWith('.md'));
    for (const skillFile of skillFiles) {
      const skillName = skillFile.replace('.md', '');
      const skillDir = join(projectSkillsDir, skillName);
      mkdirSync(skillDir, { recursive: true });
      copyFileSync(join(skillTemplatesDir, skillFile), join(skillDir, 'SKILL.md'));
    }
  }

  const toolDisplay = cliTool === 'gemini-cli' ? 'Gemini CLI' : 'Claude Code';
  console.log(`
✓ Project "${name}" created at ${projectDir}

  config.json     — CLI tool: ${cliTool}, mode: ${mode}, max tokens: ${maxTokens}
  STATE.json      — Lifecycle: idle
  ECOSYSTEM.md    — Empty ecosystem map
  repos/          — Repository profiles (empty)
  plans/          — Task plans (empty)
  logs/           — Execution logs (empty)

Next steps:
  1. Open your AI tool (${toolDisplay})
  2. Run ptah:register <path> --role <role> to add repositories
  3. Run ptah:learn to scan repository structure
`);
}
