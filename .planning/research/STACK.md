# Stack Research

**Domain:** Skill-based meta-orchestration / multi-repo AI coding coordination
**Researched:** 2026-04-03 | **Updated:** 2026-04-06 (npx install, multi-project model)
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.7+ | Helper scripts & tooling | Type safety for state schemas, ecosystem scanning scripts, and any tooling logic |
| Node.js | 22 LTS | Runtime for helper scripts | File scanning, JSON/YAML processing, git operations for ecosystem learning |
| Markdown | — | Skill definitions, state tracking | Primary format — skill files, planning artifacts, ecosystem state |
| JSON | — | Structured state & config | Config files, contract registry, ecosystem map, task DAGs |

### Supporting Libraries (for helper scripts)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| simple-git | 3.x | Git operations | Reading diffs post-execution, inspecting repo state across registered repos |
| glob / fast-glob | 11.x / 3.x | File discovery | Scanning repos for contracts, schemas, API definitions during ecosystem learning |
| zod | 3.x | Schema validation | Validating config files, ecosystem state, contract definitions — runtime type safety |
| yaml | 2.x | YAML parsing | Parsing config/frontmatter in skill files |
| diff | 7.x | Diff parsing | Parsing git diffs for result collection post-execution |
| chalk | 5.x | Terminal colors | Rich output in helper scripts (optional — AI tools have their own formatting) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| vitest | Unit/integration testing | Testing helper scripts, state management logic |
| tsx | TypeScript execution | Running helper scripts without build step |
| eslint + prettier | Code quality | Standard TypeScript linting for helper scripts |

## What Changed (Extension Model Pivot)

| Before (Standalone CLI) | After (Extension Model) | Why |
|--------------------------|------------------------|-----|
| Commander.js CLI framework | Skill files (Markdown) | AI tools discover and execute skills natively |
| execa for subprocess management | Not needed | AI tool IS the executor — no subprocesses |
| listr2 for task UI | Not needed | AI tool handles its own output/progress |
| ora for spinners | Not needed | AI tool handles UX |
| cosmiconfig for config | Direct JSON/YAML loading | Simpler config via `.ptah/config.json` |
| p-limit/p-queue for concurrency | Skill instructions guide execution order | AI tool follows skill instructions for wave ordering |
| tiktoken for token counting | Not needed for v1 | Token optimization deferred; AI tool manages its own context |
| tsup for bundling/npm standalone | npm package with thin CLI | Ptah IS distributed via npm, but as a thin CLI + skills, not a heavy standalone CLI |

## What's Still Needed

The stack is dramatically simpler. Ptah now consists of:

1. **npm package** with `bin` entry — `npx ptah` or `npm install -g ptah`
2. **Thin CLI** (TypeScript) — `ptah init`, `ptah list`, `ptah help`
3. **Skill files** (Markdown) — the commands users invoke inside AI tools
4. **State schemas** (Zod + TypeScript) — validate per-project state files
5. **Helper scripts** (TypeScript) — ecosystem scanning, contract discovery, DAG generation
6. **Templates** (Markdown) — planning templates, state file templates

### Installation

```bash
# Users install via npx
npx ptah
# or globally
npm install -g ptah
```

```bash
# For development
npm install simple-git glob fast-glob zod yaml diff
npm install -D typescript tsx vitest @types/node eslint prettier
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Markdown skills | Standalone CLI (Commander.js) | If the skill model proves too limiting for complex orchestration — reassess at v1.x |
| simple-git | isomorphic-git | Never for this project — targets dev machines with git installed |
| zod | JSON Schema | If cross-language validation needed — zod's DX is superior for TypeScript |
| Helper scripts (TS) | Shell scripts (bash) | Never — TypeScript gives type safety for ecosystem state management |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Commander.js / oclif | Overkill — Ptah’s CLI is minimal (init, list, help) | Minimal arg parsing (process.argv or meow) |
| execa | No subprocess management needed | AI tool executes directly |
| LangChain/LangGraph | Ptah doesn't call LLM APIs | Leverages host AI tool |
| Express/Fastify | Not a server | Skill files + state files |
| Heavy CLI frameworks | Thin CLI only needs init/list/help | Minimal bin entrypoint |

## Tool-Specific Considerations

### Gemini CLI
- Skill discovery mechanism: TBD — research Gemini CLI's extension/skill format
- May use different file naming convention than SKILL.md
- Need to verify how Gemini CLI handles custom commands

### Claude Code
- SKILL.md format — well-documented, GSD reference exists
- Supports subagent spawning for parallel tasks
- Discovers skills in workspace directories

### Shared Core
- State files (per-project in `~/.ptah/projects/`) readable by both tools (plain Markdown + JSON)
- Helper scripts callable by either tool via shell commands
- Planning templates are tool-agnostic Markdown

## Sources

- GSD framework source — reference architecture for skill-based delivery model
- Claude Code documentation — SKILL.md format and discovery patterns
- Node.js 22 documentation — ESM support, file system APIs
- All packages verified against npm registry (April 2026)

---
*Stack research for: Skill-based meta-orchestration with npm package CLI*
*Updated: 2026-04-06 (npx install, multi-project model)*
