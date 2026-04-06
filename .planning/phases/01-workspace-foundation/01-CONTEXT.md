# Phase 1: Workspace Foundation - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

## Phase Boundary

This phase delivers the npm package scaffolding, thin CLI for project management (`ptah init`, `ptah list`), the `~/.ptah/` global home directory structure, per-project config and state management, and the `ptah:help` skill. After this phase, a user can install Ptah via `npx ptah`, create projects, and see available commands. All subsequent phases build on these foundations.

## Implementation Decisions

### Installation & Distribution
- **D-01:** Ptah is distributed as an npm package installable via `npx ptah` or `npm install -g ptah`. The package includes a thin CLI, skill files, helper scripts, and templates.
- **D-02:** The CLI entrypoint lives in `bin/ptah.ts` and is referenced via the `package.json` `bin` field.

### Project Model
- **D-03:** Ptah supports multiple independent projects. Each `ptah init <name>` creates a project in `~/.ptah/projects/<name>/`.
- **D-04:** The global `.ptah/` home directory defaults to `~/.ptah/` but the user can specify a custom location.
- **D-05:** Users can list all projects with `ptah list` and switch between them.
- **D-06:** Each project is fully independent — own repos, contracts, plans, config, and state.

### Per-Project Configuration
- **D-07:** Per-project `config.json` includes:
  - `cli_tool` — which AI tool to use (`gemini-cli` or `claude-code`)
  - `max_tokens` — max tokens per session budget
  - `mode` — `auto-accept` vs `safe` (controls permission gates)
- **D-08:** Global `config.json` at `~/.ptah/config.json` stores defaults (default CLI tool, global preferences).

### Skill File Structure
- **D-09:** Agent's discretion — choose the best SKILL.md format that works for both Gemini CLI and Claude Code. Skill files live in `skills/ptah:<command>/SKILL.md`.

### State Management
- **D-10:** Per-project `STATE.json` tracks current lifecycle phase, progress, and session state. Persists across AI tool restarts.
- **D-11:** All state files validated with zod schemas at read time.

### Agent's Discretion
- Skill file internal structure and format (D-09) — agent will design based on what works best for dual-tool compatibility
- Arg parsing approach for thin CLI — minimal (process.argv, meow, or similar lightweight approach)
- Template file contents — agent will design sensible defaults for config.json, ECOSYSTEM.md, etc.
- Error handling patterns in CLI — agent will establish during implementation

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value, constraints, workflow model, key decisions, multi-project model
- `.planning/REQUIREMENTS.md` — INIT-01 through INIT-07 requirements for this phase

### Architecture
- `.planning/research/ARCHITECTURE.md` — Repo structure, `.ptah/` global home directory layout, data flows, initialization flow
- `.planning/research/STACK.md` — Recommended stack (npm package, thin CLI, TypeScript, zod, etc.)

### Risk Mitigation
- `.planning/research/PITFALLS.md` — Skill instruction drift, state corruption, dual-tool divergence patterns
- `.planning/research/PITFALLS.md` §Security Mistakes — `~/.ptah/` file permissions, secret handling

### Roadmap
- `.planning/ROADMAP.md` §Phase 1 — Success criteria (8 items), plan breakdown (4 plans)

## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing code to reuse.

### Established Patterns
- GSD framework — reference for skill file format, SKILL.md structure, skill discovery patterns
- GSD `SKILL.md` frontmatter — `name`, `description` fields as proven pattern for AI tool discovery

### Integration Points
- npm registry — package must be publishable with `bin` entry
- Gemini CLI skill discovery — skills directory must be discoverable
- Claude Code SKILL.md — skill files must follow Claude Code's discovery conventions

## Specific Ideas

- Command format uses `ptah:<command>` (e.g., `ptah:help`, `ptah:register`, `ptah:plan`)
- CLI commands (non-skill) use `ptah <subcommand>` (e.g., `ptah init`, `ptah list`)
- The thin CLI handles project management only — all orchestration happens through skills inside AI tools
- Project directory structure follows the layout in ARCHITECTURE.md §`.ptah/` Global Home Directory

## Deferred Ideas

- `ptah:register` (repo registration) — Phase 2
- `ptah:learn` (ecosystem scanning) — Phase 2
- `ptah:discover` (contract discovery) — Phase 2
- `ptah:plan` (task planning) — Phase 3
- `ptah:execute` (wave execution) — Phase 4
- `ptah:verify` (verification) — Phase 4
- `ptah:status` (progress status) — Phase 4
- Gemini CLI integration testing — Phase 5
- Claude Code integration testing — Phase 5
- Permission gates (auto-accept/safe mode enforcement) — Phase 5

---

*Phase: 01-workspace-foundation*
*Context gathered: 2026-04-06*
