---
phase: 01-workspace-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - tsconfig.json
  - tsup.config.ts
  - src/cli.ts
  - .gitignore
autonomous: true
requirements: [INIT-01]

must_haves:
  truths:
    - '`npx ptah --help` displays available commands (init, list, help)'
    - '`npm run build` produces dist/cli.js with shebang'
    - 'package.json has bin entry pointing to dist/cli.js'
  artifacts:
    - path: 'package.json'
      provides: 'npm package definition with bin entry'
      contains: '"bin"'
    - path: 'src/cli.ts'
      provides: 'CLI entrypoint with argument routing'
      contains: 'process.argv'
    - path: 'tsconfig.json'
      provides: 'TypeScript configuration for Node.js CLI'
      contains: 'NodeNext'
    - path: 'tsup.config.ts'
      provides: 'Build configuration for CLI bundling'
      contains: 'tsup'
---

<objective>
Scaffold the npm package foundation for Ptah.

Purpose: Create the base package.json with bin entry, TypeScript config, build pipeline (tsup), and CLI entrypoint that routes `ptah init`, `ptah list`, and `ptah help` commands. After this plan, `npm run build && npx .` works.

Output: 5 files — package.json, tsconfig.json, tsup.config.ts, src/cli.ts, .gitignore
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
  <name>Task 1: Create package.json with bin entry and dependencies</name>
  <files>package.json</files>
  <read_first>.planning/phases/01-workspace-foundation/01-RESEARCH.md</read_first>
  <action>
Create `package.json` with the following exact content:

```json
{
  "name": "ptah",
  "version": "0.1.0",
  "description": "Meta-orchestration framework for cross-repository AI coding coordination",
  "type": "module",
  "bin": {
    "ptah": "./dist/cli.js"
  },
  "files": [
    "dist",
    "skills",
    "templates",
    "scripts"
  ],
  "scripts": {
    "dev": "tsx src/cli.ts",
    "build": "tsup",
    "prepublishOnly": "npm run build",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "ai",
    "orchestration",
    "multi-repo",
    "cross-repo",
    "gemini-cli",
    "claude-code",
    "coding-assistant"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```
  </action>
  <acceptance_criteria>
    - `package.json` exists and contains `"name": "ptah"`
    - `package.json` contains `"bin": { "ptah": "./dist/cli.js" }`
    - `package.json` contains `"zod"` in dependencies
    - `package.json` contains `"type": "module"`
    - `package.json` contains `"files"` array with `"dist"`, `"skills"`, `"templates"`, `"scripts"`
  </acceptance_criteria>
  <verify>
    <automated>test -f package.json && grep -q '"ptah": "./dist/cli.js"' package.json && grep -q '"zod"' package.json && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>package.json created with bin entry, dependencies (zod), dev dependencies (tsup, tsx, typescript), and files array.</done>
</task>

<task type="auto">
  <name>Task 2: Create TypeScript and build configuration</name>
  <files>tsconfig.json, tsup.config.ts</files>
  <read_first>package.json</read_first>
  <action>
Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

Create `tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  sourcemap: false,
  minify: false,
  dts: false,
});
```

The `banner.js` injects the shebang `#!/usr/bin/env node` at the top of the built file so it works as an executable.
  </action>
  <acceptance_criteria>
    - `tsconfig.json` exists and contains `"module": "NodeNext"`
    - `tsup.config.ts` exists and contains `'src/cli.ts'` as entry
    - `tsup.config.ts` contains `#!/usr/bin/env node` in banner
  </acceptance_criteria>
  <verify>
    <automated>test -f tsconfig.json && test -f tsup.config.ts && grep -q "NodeNext" tsconfig.json && grep -q "#!/usr/bin/env node" tsup.config.ts && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>TypeScript config targets ESNext/NodeNext. tsup builds to ESM with shebang banner.</done>
</task>

<task type="auto">
  <name>Task 3: Create CLI entrypoint with command routing</name>
  <files>src/cli.ts</files>
  <read_first>package.json</read_first>
  <action>
Create `src/cli.ts` — the thin CLI entrypoint that routes commands:

```typescript
import { version } from '../package.json' with { type: 'json' };

const args = process.argv.slice(2);
const command = args[0];

function showHelp(): void {
  console.log(`
ptah v${version} — Meta-orchestration for cross-repo AI coding

Usage:
  ptah init <name> [options]    Create a new Ptah project
  ptah list                     List all Ptah projects
  ptah help                     Show this help message

Options:
  --location <path>             Custom location for .ptah/ home (default: ~/.ptah)
  --cli-tool <tool>             AI tool to use: gemini-cli | claude-code (default: gemini-cli)
  --version, -v                 Show version number

Commands available as AI tool skills:
  ptah:help        Show available Ptah commands inside AI tool
  ptah:register    Register a repository (Phase 2)
  ptah:learn       Scan ecosystem structure (Phase 2)
  ptah:discover    Discover cross-repo contracts (Phase 2)
  ptah:plan        Generate task plans (Phase 3)
  ptah:execute     Execute task plans (Phase 4)
  ptah:verify      Verify completed work (Phase 4)
  ptah:status      Show workspace status (Phase 4)

Get started:
  npx ptah init my-project
`);
}

function showVersion(): void {
  console.log(`ptah v${version}`);
}

async function main(): Promise<void> {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    showVersion();
    return;
  }

  switch (command) {
    case 'init': {
      const { runInit } = await import('./commands/init.js');
      await runInit(args.slice(1));
      break;
    }
    case 'list': {
      const { runList } = await import('./commands/list.js');
      await runList(args.slice(1));
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "ptah help" for available commands.');
      process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
```

Also create placeholder command files so imports don't break:

`src/commands/init.ts`:
```typescript
export async function runInit(_args: string[]): Promise<void> {
  console.log('ptah init — not yet implemented (see Plan 02)');
}
```

`src/commands/list.ts`:
```typescript
export async function runList(_args: string[]): Promise<void> {
  console.log('ptah list — not yet implemented (see Plan 02)');
}
```
  </action>
  <acceptance_criteria>
    - `src/cli.ts` exists and contains `process.argv`
    - `src/cli.ts` contains `case 'init':` and `case 'list':` routing
    - `src/cli.ts` contains `showHelp` function with usage text
    - `src/commands/init.ts` exists and exports `runInit`
    - `src/commands/list.ts` exists and exports `runList`
  </acceptance_criteria>
  <verify>
    <automated>test -f src/cli.ts && grep -q "process.argv" src/cli.ts && grep -q "case 'init'" src/cli.ts && test -f src/commands/init.ts && test -f src/commands/list.ts && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>CLI entrypoint created with command routing for init, list, help. Placeholder command files for init and list.</done>
</task>

<task type="auto">
  <name>Task 4: Create .gitignore</name>
  <files>.gitignore</files>
  <read_first></read_first>
  <action>
Create `.gitignore`:

```
node_modules/
dist/
*.tsbuildinfo
.DS_Store
```
  </action>
  <acceptance_criteria>
    - `.gitignore` exists and contains `node_modules/`
    - `.gitignore` contains `dist/`
  </acceptance_criteria>
  <verify>
    <automated>test -f .gitignore && grep -q "node_modules" .gitignore && grep -q "dist/" .gitignore && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>.gitignore covers node_modules, dist, build artifacts.</done>
</task>

</tasks>

<verification>
1. `npm install` — installs dependencies without errors
2. `npm run build` — produces `dist/cli.js` with shebang
3. `node dist/cli.js help` — displays help text with version
4. `npm run typecheck` — no TypeScript errors
</verification>

<success_criteria>
- package.json has correct bin entry and dependencies
- tsup builds CLI to dist/cli.js with shebang
- `ptah help` displays available commands
- `ptah init` and `ptah list` route to placeholder implementations
- TypeScript compiles with no errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-workspace-foundation/01-01-SUMMARY.md`
</output>
