---
phase: 01-workspace-foundation
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - src/commands/init.ts
  - src/commands/list.ts
  - src/lib/paths.ts
  - src/lib/schemas.ts
  - templates/config.json
  - templates/ECOSYSTEM.md
  - templates/STATE.json
autonomous: true
requirements: [INIT-02, INIT-03, INIT-05, INIT-07]

must_haves:
  truths:
    - '`ptah init my-project` creates ~/.ptah/projects/my-project/ with config.json, STATE.json, ECOSYSTEM.md'
    - '`ptah init my-project --location /custom/path` creates /custom/path/projects/my-project/'
    - '`ptah list` displays all projects in ~/.ptah/projects/'
    - 'Per-project config.json contains cli_tool, max_tokens, and mode fields'
  artifacts:
    - path: 'src/commands/init.ts'
      provides: 'Project creation logic with directory scaffolding'
      contains: 'mkdirSync'
    - path: 'src/commands/list.ts'
      provides: 'Project listing from ~/.ptah/projects/'
      contains: 'readdirSync'
    - path: 'src/lib/paths.ts'
      provides: 'Path resolution for .ptah home and project directories'
      contains: 'PTAH_HOME'
    - path: 'templates/config.json'
      provides: 'Default project config template'
      contains: 'cli_tool'
---

<objective>
Implement `ptah init` and `ptah list` commands with full project management.

Purpose: Enable users to create independent Ptah projects in `~/.ptah/projects/<name>/`, each with config, state, and ecosystem template files. Support custom home directory location via `--location` flag. Enable listing all projects.

Output: 7 files — init command, list command, path utilities, schema definitions, and 3 templates.
</objective>

<execution_context>
@~/.gemini/antigravity/get-shit-done/workflows/execute-plan.md
@~/.gemini/antigravity/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-workspace-foundation/01-CONTEXT.md
@.planning/phases/01-workspace-foundation/01-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create path resolution utilities</name>
  <files>src/lib/paths.ts</files>
  <read_first>src/cli.ts, .planning/phases/01-workspace-foundation/01-CONTEXT.md</read_first>
  <action>
Create `src/lib/paths.ts` — centralized path resolution for all Ptah directories:

```typescript
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

const DEFAULT_PTAH_HOME = join(homedir(), '.ptah');
const GLOBAL_CONFIG_FILE = 'config.json';

export function getPtahHome(): string {
  // Check PTAH_HOME environment variable first
  if (process.env.PTAH_HOME) {
    return process.env.PTAH_HOME;
  }

  // Check if global config exists with custom path
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
```
  </action>
  <acceptance_criteria>
    - `src/lib/paths.ts` exists and contains `getPtahHome` function
    - `src/lib/paths.ts` checks `process.env.PTAH_HOME` first
    - `src/lib/paths.ts` exports `getProjectsDir`, `getProjectDir`, `getGlobalConfigPath`
    - Default path resolves to `~/.ptah`
  </acceptance_criteria>
  <verify>
    <automated>test -f src/lib/paths.ts && grep -q "getPtahHome" src/lib/paths.ts && grep -q "PTAH_HOME" src/lib/paths.ts && grep -q "getProjectDir" src/lib/paths.ts && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>Path resolution module with environment variable override, global config check, and project directory helpers.</done>
</task>

<task type="auto">
  <name>Task 2: Create template files for new projects</name>
  <files>templates/config.json, templates/ECOSYSTEM.md, templates/STATE.json</files>
  <read_first>.planning/phases/01-workspace-foundation/01-CONTEXT.md, .planning/research/ARCHITECTURE.md</read_first>
  <action>
Create 3 template files that get copied during `ptah init`:

**1. `templates/config.json`:**
```json
{
  "cli_tool": "gemini-cli",
  "max_tokens": 200000,
  "mode": "safe",
  "created_at": "",
  "ptah_version": ""
}
```

**2. `templates/ECOSYSTEM.md`:**
```markdown
# Ecosystem Map

**Project:** {{PROJECT_NAME}}
**Created:** {{CREATED_AT}}

## Registered Repositories

_No repositories registered yet. Use `ptah:register <path> --role <role>` to add repos._

| Repository | Role | Path | Framework | Language |
|------------|------|------|-----------|----------|

## Relationships

_Relationships will be discovered after registering repos and running `ptah:discover`._
```

**3. `templates/STATE.json`:**
```json
{
  "lifecycle": "idle",
  "repos_registered": 0,
  "contracts_discovered": 0,
  "current_plan": null,
  "tasks": {
    "total": 0,
    "completed": 0,
    "failed": 0,
    "current_wave": 0
  },
  "last_session": null
}
```
  </action>
  <acceptance_criteria>
    - `templates/config.json` exists and contains `"cli_tool"`, `"max_tokens"`, `"mode"`
    - `templates/ECOSYSTEM.md` exists and contains `{{PROJECT_NAME}}` placeholder
    - `templates/STATE.json` exists and contains `"lifecycle": "idle"`
  </acceptance_criteria>
  <verify>
    <automated>test -f templates/config.json && test -f templates/ECOSYSTEM.md && test -f templates/STATE.json && grep -q "cli_tool" templates/config.json && grep -q "lifecycle" templates/STATE.json && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>Three template files created for project initialization: config, ecosystem map, state.</done>
</task>

<task type="auto">
  <name>Task 3: Implement `ptah init` command</name>
  <files>src/commands/init.ts</files>
  <read_first>src/lib/paths.ts, templates/config.json, templates/ECOSYSTEM.md, templates/STATE.json, src/cli.ts</read_first>
  <action>
Replace `src/commands/init.ts` with full implementation:

```typescript
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getPtahHome, getProjectDir, getProjectsDir, getGlobalConfigPath } from '../lib/paths.js';
import { version } from '../../package.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

function parseInitArgs(args: string[]): { name: string | null; location: string | null; cliTool: string; maxTokens: number; mode: string } {
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

export async function runInit(args: string[]): Promise<void> {
  const { name, location, cliTool, maxTokens, mode } = parseInitArgs(args);

  if (!name) {
    console.error('Error: Project name is required.');
    console.error('Usage: ptah init <project-name> [--location <path>] [--cli-tool <tool>]');
    process.exit(1);
  }

  // Validate project name
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(name)) {
    console.error(`Error: Invalid project name "${name}". Use alphanumeric characters, hyphens, dots, and underscores.`);
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
  configTemplate.ptah_version = version;
  writeFileSync(join(projectDir, 'config.json'), JSON.stringify(configTemplate, null, 2));

  // Copy STATE.json template
  copyFileSync(join(TEMPLATES_DIR, 'STATE.json'), join(projectDir, 'STATE.json'));

  // Copy and customize ECOSYSTEM.md template
  let ecosystem = readFileSync(join(TEMPLATES_DIR, 'ECOSYSTEM.md'), 'utf-8');
  ecosystem = ecosystem.replace('{{PROJECT_NAME}}', name);
  ecosystem = ecosystem.replace('{{CREATED_AT}}', new Date().toISOString().split('T')[0]);
  writeFileSync(join(projectDir, 'ECOSYSTEM.md'), ecosystem);

  // Output success
  console.log(`
✓ Project "${name}" created at ${projectDir}

  config.json     — CLI tool: ${cliTool}, mode: ${mode}, max tokens: ${maxTokens}
  STATE.json      — Lifecycle: idle
  ECOSYSTEM.md    — Empty ecosystem map
  repos/          — Repository profiles (empty)
  plans/          — Task plans (empty)
  logs/           — Execution logs (empty)

Next steps:
  1. Open your AI tool (${cliTool === 'gemini-cli' ? 'Gemini CLI' : 'Claude Code'})
  2. Run ptah:register <path> --role <role> to add repositories
  3. Run ptah:learn to scan repository structure
`);
}
```
  </action>
  <acceptance_criteria>
    - `src/commands/init.ts` contains `mkdirSync` for creating project directories
    - `src/commands/init.ts` parses `--location`, `--cli-tool`, `--max-tokens`, `--mode` flags
    - `src/commands/init.ts` validates project name with regex
    - `src/commands/init.ts` checks for existing project and errors if exists
    - `src/commands/init.ts` creates repos/, plans/current/tasks/, plans/archive/, logs/ subdirectories
    - `src/commands/init.ts` copies and customizes template files
  </acceptance_criteria>
  <verify>
    <automated>test -f src/commands/init.ts && grep -q "mkdirSync" src/commands/init.ts && grep -q "location" src/commands/init.ts && grep -q "cli_tool" src/commands/init.ts && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>`ptah init` creates project directory with config, state, ecosystem template, and subdirectories.</done>
</task>

<task type="auto">
  <name>Task 4: Implement `ptah list` command</name>
  <files>src/commands/list.ts</files>
  <read_first>src/lib/paths.ts, src/commands/init.ts</read_first>
  <action>
Replace `src/commands/list.ts` with full implementation:

```typescript
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { getPtahHome, getProjectsDir } from '../lib/paths.js';

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
```
  </action>
  <acceptance_criteria>
    - `src/commands/list.ts` contains `readdirSync` for reading projects directory
    - `src/commands/list.ts` reads config.json and STATE.json for each project
    - `src/commands/list.ts` displays project name, CLI tool, mode, and lifecycle status
    - `src/commands/list.ts` shows "No Ptah projects found" when empty
  </acceptance_criteria>
  <verify>
    <automated>test -f src/commands/list.ts && grep -q "readdirSync" src/commands/list.ts && grep -q "config.json" src/commands/list.ts && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>`ptah list` reads ~/.ptah/projects/, displays name, CLI tool, mode, and lifecycle for each project.</done>
</task>

</tasks>

<verification>
1. `npm run build` — builds without errors
2. `node dist/cli.js init test-project` — creates project in ~/.ptah/projects/test-project/
3. `node dist/cli.js list` — shows test-project with config details
4. `node dist/cli.js init test-project` — errors "already exists"
5. `npm run typecheck` — no TypeScript errors
</verification>

<success_criteria>
- `ptah init <name>` creates project with config, state, ecosystem files and subdirectories
- `ptah init` supports --location, --cli-tool, --max-tokens, --mode flags
- `ptah list` displays all projects with their config and status
- Project names are validated
- Duplicate project names are rejected
</success_criteria>

<output>
After completion, create `.planning/phases/01-workspace-foundation/01-02-SUMMARY.md`
</output>
