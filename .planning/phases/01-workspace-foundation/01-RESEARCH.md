# Phase 1: Workspace Foundation - Research

**Researched:** 2026-04-06
**Status:** Complete

## Key Questions Investigated

### 1. AI Tool Skill Discovery Mechanisms

**Gemini CLI:**
- Scans `~/.gemini/skills/` (user-level) and `.gemini/skills/` (workspace-level)
- Reads YAML frontmatter (`name`, `description`) from SKILL.md files
- Only frontmatter loaded into context initially (~100 tokens per skill)
- Full markdown body loaded only when skill is activated
- Management via `/skills list`, `/skills enable`, `/skills disable`, `/skills link <path>`
- Discovery tiers: Workspace > User > Extension (workspace takes precedence on name conflicts)

**Claude Code:**
- Scans `.agent/skills/` or `.agents/skills/` (workspace-level)
- Same YAML frontmatter pattern (`name`, `description`)
- Progressive loading: metadata scanned → relevance matched → full body loaded on activation
- Optional frontmatter fields: `disable-model-invocation`, `user-invocable`

**Implication for Ptah:**
- Both tools use identical SKILL.md format (YAML frontmatter + markdown body)
- Installation needs to symlink skill directories into the right discovery paths:
  - Gemini CLI: `~/.gemini/skills/ptah-<command>/SKILL.md`
  - Claude Code: Workspace-level `.agent/skills/ptah-<command>/SKILL.md` OR user-level path
- A `postinstall` script or `ptah init` can create these symlinks
- **Decision needed:** Use `ptah init` (explicit user action) rather than `postinstall` (implicit/intrusive) to link skills into AI tool directories

### 2. npm Package CLI Architecture

**Best practices for TypeScript CLI tools:**
- Source in `src/`, compiled output in `dist/`
- `package.json` `bin` field points to compiled JS (`./dist/cli.js`)
- Build with `tsup` (esbuild wrapper) — fast, zero-config, handles ESM/CJS
- Development with `tsx` for rapid iteration without build step
- Shebang `#!/usr/bin/env node` required on CLI entrypoint

**Package structure:**
```json
{
  "name": "ptah",
  "bin": {
    "ptah": "./dist/cli.js"
  },
  "files": ["dist", "skills", "templates", "scripts"],
  "scripts": {
    "dev": "tsx src/cli.ts",
    "build": "tsup src/cli.ts --format esm --minify --out-dir dist",
    "prepublishOnly": "npm run build"
  }
}
```

**Key insight:** The `files` field in package.json controls what gets published to npm. We MUST include `skills/`, `templates/`, and `scripts/` alongside `dist/` so they ship with the package.

### 3. Skill Installation Strategy

**Options evaluated:**

| Strategy | Pros | Cons |
|----------|------|------|
| `postinstall` symlink | Automatic, zero user effort | Intrusive, permission issues, security concerns, Windows complications |
| `ptah init` creates links | Explicit user consent, can configure per-tool | Extra step after install |
| `ptah link` separate command | Decouples install from skill setup | More commands to remember |
| Direct path in GEMINI.md | No linking needed, Gemini reads GEMINI.md | Only works for Gemini CLI, not Claude Code |

**Recommended approach:** `ptah init` handles skill linking as part of project creation:
1. User runs `npx ptah init my-project`
2. CLI creates `~/.ptah/projects/my-project/`
3. CLI detects installed AI tools (checks for `~/.gemini/`, `.agent/`)
4. CLI symlinks Ptah skills into the AI tool's skill discovery directory
5. CLI reports which tools were configured

**Fallback:** `ptah link` as standalone command for users who want to re-link or link to a different tool.

### 4. Directory Structure & Colons in Filenames

**Problem:** Skill names use `ptah:<command>` format, but colons are invalid in filenames on Windows and problematic on some filesystems.

**Solutions:**
- Use `ptah-<command>` as directory name, `ptah:<command>` as `name` in SKILL.md frontmatter
- GSD uses `gsd-<command>` pattern — no colons in directory names
- The `name` field in frontmatter is what the AI tool displays/matches, not the directory name

**Decision:** Directory names use hyphens (`ptah-help/`), frontmatter `name` uses colons (`ptah:help`).

### 5. Thin CLI Arg Parsing

**Options evaluated:**

| Library | Size | Features | Verdict |
|---------|------|----------|---------|
| `commander` | 60KB | Full-featured, help generation, subcommands | Overkill for 3 commands |
| `yargs` | 300KB+ | Very heavy, interactive | Way too heavy |
| `meow` | 15KB | Minimal, clean API | Good fit |
| `citty` | 8KB | Modern, tree-shakeable | Good fit |
| Raw `process.argv` | 0KB | No dependency | Sufficient for init/list/help |

**Recommendation:** Start with raw `process.argv` parsing for v1 (only 3 commands: `init`, `list`, `help`). Add `meow` or `citty` if commands grow beyond 5-6. The thin CLI should stay thin.

### 6. State & Config Schema Design

**Zod schema patterns for config.json:**
```typescript
const ProjectConfigSchema = z.object({
  cli_tool: z.enum(['gemini-cli', 'claude-code']).default('gemini-cli'),
  max_tokens: z.number().positive().default(200000),
  mode: z.enum(['auto-accept', 'safe']).default('safe'),
  created_at: z.string().datetime(),
  ptah_version: z.string(),
});

const GlobalConfigSchema = z.object({
  default_cli_tool: z.enum(['gemini-cli', 'claude-code']).default('gemini-cli'),
  ptah_home: z.string().default('~/.ptah'),
  projects_dir: z.string().default('~/.ptah/projects'),
});

const StateSchema = z.object({
  lifecycle: z.enum(['idle', 'learning', 'discovering', 'planning', 'planned', 'executing', 'verifying', 'complete']).default('idle'),
  repos_registered: z.number().default(0),
  contracts_discovered: z.number().default(0),
  current_plan: z.string().nullable().default(null),
  tasks: z.object({
    total: z.number().default(0),
    completed: z.number().default(0),
    failed: z.number().default(0),
    current_wave: z.number().default(0),
  }).default({}),
  last_session: z.string().datetime().nullable().default(null),
});
```

**File operations pattern:**
```typescript
// Read with validation
function readConfig(projectPath: string): ProjectConfig {
  const raw = JSON.parse(fs.readFileSync(path.join(projectPath, 'config.json'), 'utf-8'));
  return ProjectConfigSchema.parse(raw);
}

// Write with validation
function writeState(projectPath: string, state: State): void {
  const validated = StateSchema.parse(state);
  fs.writeFileSync(
    path.join(projectPath, 'STATE.json'),
    JSON.stringify(validated, null, 2)
  );
}
```

### 7. Build & Publish Pipeline

**Build chain:**
1. TypeScript source → `tsup` builds to `dist/cli.js`
2. `prepublishOnly` script ensures build runs before `npm publish`
3. `files` field includes: `dist/`, `skills/`, `templates/`, `scripts/`
4. `bin` points to `dist/cli.js`

**Development workflow:**
- `tsx src/cli.ts init test-project` — direct TypeScript execution
- `npm link` — test as globally installed CLI
- `npm run build && npx .` — test as npx package

### 8. Helper Script Execution from Skills

**How skills invoke helper scripts:**
- Skills tell the AI to run: `tsx /path/to/ptah/scripts/validate-state.ts --project my-project`
- The path to Ptah's installed location needs to be discoverable
- **Solution:** Store Ptah's package path in global config during `ptah init`:
  ```json
  {
    "ptah_install_path": "/usr/local/lib/node_modules/ptah",
    "default_cli_tool": "gemini-cli"
  }
  ```
- Skills reference: `tsx ${PTAH_HOME}/scripts/validate-state.ts`
- Alternative: Use `npx ptah-scripts validate-state` (but adds latency)

**Recommendation:** Store install path in `~/.ptah/config.json` and reference via environment variable or direct path in skill instructions.

## Validation Architecture

Not applicable (Nyquist validation disabled).

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Colon in skill directory names breaks Windows | HIGH | Use hyphens in directory names, colons only in frontmatter `name` |
| Symlink creation fails (permissions) | MEDIUM | Graceful failure with clear error message and manual instructions |
| `tsup` build adds complexity | LOW | Standard tooling, well-documented, fast |
| `process.argv` parsing too limited | LOW | Only 3 commands; can add meow later |
| AI tools don't discover symlinked skills | MEDIUM | Test both tools; fallback to copy instead of symlink |
| npx caching stale versions | LOW | Standard npm versioning; `npx ptah@latest` for forced update |

## Dependencies Summary

**Runtime (shipped with package):**
- `zod` — schema validation for config/state
- No other runtime deps needed for Phase 1

**Dev dependencies:**
- `typescript` — type checking
- `tsup` — bundling
- `tsx` — development execution
- `@types/node` — Node.js type definitions

## RESEARCH COMPLETE

Research covers all key areas for Phase 1 planning: AI tool skill discovery, npm package architecture, skill installation strategy, CLI arg parsing, state schemas, and build pipeline. No blockers identified.
