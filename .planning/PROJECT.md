# Ptah

## What This Is

Ptah is a skill-based meta-orchestration framework that extends AI coding tools (Gemini CLI, Claude Code) with cross-repository coordination capabilities. Install via `npx ptah`, then create projects with `ptah init <name>` — each project manages its own set of repos, contracts, and plans. When you invoke `/ptah:plan` or `/ptah:execute` from within Gemini CLI or Claude Code, Ptah provides the planning intelligence, multi-repo awareness, and dependency-aware execution that no single-repo AI tool offers. Named after the Egyptian god of craftsmen — creation through thought and speech.

## Core Value

Enable a developer to make precise, cross-repository changes with architectural rigor, by extending their existing AI coding tools with multi-repo awareness, contract discovery, and dependency-aware parallel execution — all while minimizing token consumption through intelligent context engineering.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] npm/npx installation — `npx ptah` installs CLI + skills + helper scripts globally
- [ ] Multi-project model — `ptah init <name>` creates independent projects, each with own repos/contracts/plans
- [ ] User-specified or default global location — `.ptah/` defaults to `~/.ptah/`, user can override
- [ ] Per-project config — CLI tool (Gemini CLI / Claude Code), max tokens per session, auto-accept vs safe mode
- [ ] Progressive ecosystem learning — Ptah studies registered repos, discovers structure, builds understanding over time
- [ ] Auto-discovery of cross-repo contracts (APIs, schemas, shared types) with user confirmation
- [ ] Central `CONTRACTS.md` / `INTERFACES.md` maintained automatically as repos evolve
- [ ] Discuss → Plan → Execute → Verify lifecycle adapted for multi-repo context
- [ ] Atomic task plans mapped to specific repositories with dependency ordering
- [ ] Dependency-aware parallel wave execution (cross-repo dependency ordering)
- [ ] Diff-based result collection via git diffs post-execution (cheapest token-wise)
- [ ] Granular permission gates — per-action user policies (auto-accept vs safe mode)
- [ ] State tracking via Markdown + JSON artifacts (per-project in `.ptah/projects/`)
- [ ] Gemini CLI skill support — skills in Gemini CLI format
- [ ] Claude Code skill support — SKILL.md format compatible with Claude Code
- [ ] Shared core logic — planning templates, state schemas, and ecosystem formats used by both tool integrations

### Out of Scope

- Team/multi-user collaboration — Ptah is a single-developer power tool (v1)
- Auth/permissions for multi-user access — no team features
- Direct LLM API calls — Ptah leverages the AI tool it runs inside, doesn't wrap APIs separately
- GUI/web interface — runs inside existing AI tools
- Monorepo creation — Ptah works with existing repos, doesn't create monorepo structures
- CI/CD integration — not a deployment pipeline tool
- Multi-model routing — v1 uses the host tool's model; routing deferred to v1.x
- State compaction engine — deferred to v1.x after baseline token measurements
- Semantic file loading (AST-based) — deferred to v1.x

## Context

**Reference Architecture:** GSD (Get Shit Done) — https://github.com/gsd-build/get-shit-done. Ptah follows GSD's delivery model:
- Skill-based installation — skills install into AI tools, commands become available
- Context engineering via Markdown-based state tracking
- Discuss → Plan → Execute → Verify lifecycle loop
- Phased execution with success criteria
- Artifact-driven state persistence

**Key evolution from GSD:**
- Single-repo → multi-repo ecosystem awareness
- Single tool → dual-tool support (Gemini CLI + Claude Code)
- Phase-based planning → dependency-aware DAG planning across repos
- Manual contract tracking → auto-discovery of cross-repo contracts
- Growing state files → workspace-level state (`.ptah/` directory)

**Target user:** A developer working across multiple repositories who needs to coordinate complex cross-repo changes (API updates that ripple across frontend/backend/shared packages), already using Gemini CLI or Claude Code.

**Workflow model:**
1. **Install** — `npx ptah` or `npm install -g ptah` — installs CLI, skills, and helper scripts
2. **Create project** — `ptah init <project-name>` creates a project in `~/.ptah/projects/<name>/`
3. **Register repos** progressively — `ptah:register` adds repos to the project, Ptah studies each
4. **Auto-detect contracts** — APIs, schemas, shared types — then confirm with user
5. **Intake & discuss** — gather requirements, identify affected repos
6. **Plan** — break work into atomic tasks mapped to specific repos, ordered by cross-repo dependencies
7. **Execute** — dependency-aware parallel waves; the AI tool handles code generation directly
8. **Verify** — validate deliverables via automated tests and interactive UAT across ecosystem
9. **Archive** — clean planning artifacts after feature cycle completes

**Multi-project model:**
- User can have many independent projects (e.g., `my-ecommerce`, `my-saas-platform`)
- Each project has its own repos, contracts, plans, and config
- Per-project config includes: which CLI tool to use, max tokens per session, auto-accept vs safe mode
- Projects stored in `~/.ptah/projects/` (default) or user-specified location

**Execution model:**
- Wave 1: Tasks with no dependencies (e.g., modify `shared-types`)
- Wave 2: Tasks depending on Wave 1 (e.g., `backend-api` and `frontend-web` in parallel, reading updated contracts)
- Each wave maximizes parallelism within dependency constraints
- The AI tool itself executes — no subprocess management needed

**Token optimization strategy:**
- Minimal context per task — only relevant contracts and file snippets
- Diff-based result collection via git (cheapest inspection)
- Artifact-driven state — not conversation history
- Prompt structure designed for provider cache hits

## Constraints

- **Delivery model**: npm package — installs via `npx ptah`, provides thin CLI for project management + skills for AI tools
- **Tech stack**: TypeScript/Node.js for CLI, helper scripts, and tooling; Markdown for skills and state
- **Target tools**: Gemini CLI and Claude Code (v1)
- **Token budget**: Every architectural decision must minimize token consumption
- **Single user**: No multi-user, no auth, no team features in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| npm package with thin CLI | Ptah installs via `npx ptah`. Thin CLI handles project management (init, list). Skills handle orchestration inside AI tools. Best of both worlds — easy install + skill-driven execution. | — Decided |
| Multi-project model | Each `ptah init <name>` creates an independent project. User can manage multiple ecosystems. Projects stored in `~/.ptah/projects/` by default. | — Decided |
| User-specified or default global location | `.ptah/` defaults to `~/.ptah/`, user can override with custom path. | — Decided |
| Per-project config | Config includes: CLI tool (Gemini CLI / Claude Code), max tokens per session, auto-accept vs safe mode. | — Decided |
| Gemini CLI + Claude Code first | Two most capable AI coding tools. Covers Google + Anthropic ecosystems. Both support skill/command discovery. | — Decided |
| Progressive ecosystem learning | Repos registered one at a time, Ptah builds understanding. Not "configure everything upfront." | — Pending |
| Auto-detect + confirm contracts | Ptah discovers cross-repo relationships (APIs, schemas) automatically, then confirms with user. Balances automation with correctness. | — Pending |
| Git diffs for result collection | After execution, Ptah reads git diffs to understand what changed. Cheapest token-wise vs parsing verbose tool output. | — Pending |
| Shared core, tool-specific skills | Core logic (planning, state, ecosystem) is tool-agnostic. Only skill entry points differ per AI tool. Minimizes duplication. | — Pending |
| Granular permission gates | User configures per-project mode (auto-accept vs safe). Respects user's comfort level with automation. | — Pending |
| `.ptah/` global home with projects | State lives in `~/.ptah/projects/<name>/`. Each project is independent. Prevents coupling to any single repo's git history. | — Decided |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-06 after Phase 1 discuss — npx install, multi-project model*
