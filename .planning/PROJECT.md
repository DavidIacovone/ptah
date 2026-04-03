# Ptah

## What This Is

Ptah is a CLI-based meta-orchestration framework that coordinates complex software changes across multiple repositories. It sits above AI coding tools (Claude Code, Codex) and provides architectural rigor, multi-repo awareness, and aggressive token optimization. Named after the Egyptian god of craftsmen — creation through thought and speech — Ptah plans, tracks, and orchestrates while delegating actual code generation to downstream tools.

## Core Value

Enable a developer to make precise, cross-repository changes with the architectural rigor of GSD's phase-by-phase lifecycle, while minimizing token consumption through intelligent context engineering and multi-model parallelization.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] CLI scaffolding with workspace-level commands (`ptah init`, `ptah register`, `ptah plan`, `ptah execute`, etc.)
- [ ] Workspace state initialization — register repos, assign roles (`frontend-web`, `backend-api`, `shared-types`), persist ecosystem map
- [ ] Progressive ecosystem learning — Ptah studies registered repos, discovers structure, builds understanding over time
- [ ] Auto-discovery of cross-repo contracts (APIs, schemas, shared types) with user confirmation
- [ ] Central `CONTRACTS.md` / `INTERFACES.md` maintained automatically as repos evolve
- [ ] Discuss → Plan → Execute → Verify lifecycle adapted for multi-repo context
- [ ] Atomic XML-formatted task plans mapped to specific repositories
- [ ] Dependency-aware parallel wave execution (cross-repo dependency ordering)
- [ ] Multi-model router — route heavyweight tasks to Claude Code/Codex, lightweight tasks handled directly with fast models (Haiku/Flash)
- [ ] Pluggable tool adapters — Claude Code adapter and Codex adapter for v1
- [ ] Diff-based file editor for direct surgical edits (SEARCH/REPLACE blocks, no full file output)
- [ ] State compaction engine — lightweight agent continuously compresses running history into dense, factual logs
- [ ] Semantic file/tool loading — pre-processing step selects only relevant context per task (AST extraction, semantic chunking)
- [ ] Prompt caching readiness — bundle foundational context at top of requests for LLM provider cache hits
- [ ] Result collection via git diffs post-execution (cheapest token-wise)
- [ ] Artifact archival — planning artifacts archived and cleaned after feature cycle completes
- [ ] Granular permission gates — per-action user policies (commit: approval_required, push: approval_required, file_edit: auto, etc.)
- [ ] Maximize parallelism everywhere — parallel repo analysis, parallel task execution, parallel research

### Out of Scope

- Team/multi-user collaboration — Ptah is a single-developer power tool (v1)
- Auth/permissions for multi-user access — no team features
- Direct LLM API calls — Ptah delegates to existing AI coding tools, doesn't wrap APIs
- GUI/web interface — CLI-only
- Monorepo creation — Ptah works with existing repos, doesn't create monorepo structures
- CI/CD integration — not a deployment pipeline tool

## Context

**Reference Architecture:** GSD (Get Shit Done) — https://github.com/gsd-build/get-shit-done. Ptah uses GSD's foundational paradigm as its starting point:
- Context engineering via Markdown-based state tracking (PROJECT.md, STATE.md)
- Discuss → Plan → Execute → Verify lifecycle loop
- Atomic XML task plans that prevent context rot
- Phased execution with success criteria
- Artifact-driven state persistence

**Key evolution from GSD:**
- Single-repo → multi-repo ecosystem awareness
- Direct execution → meta-orchestration (delegates to Claude Code, Codex)
- Single model → tiered multi-model routing with token optimization
- Growing state files → compacted state with semantic loading
- Manual cleanup → automatic artifact archival

**Target user:** A developer working across multiple repositories in a business environment who needs to coordinate complex cross-repo changes (API updates that ripple across frontend/backend/shared packages).

**Workflow model:**
1. **Register repos** progressively — Ptah studies each, discovers structure
2. **Auto-detect contracts** — APIs, schemas, shared types — then confirm with user
3. **Intake & discuss** — gather requirements, identify affected repos
4. **Plan** — break work into atomic XML tasks mapped to specific repos, ordered by cross-repo dependencies
5. **Execute** — dependency-aware parallel waves; heavyweight tasks → Claude Code/Codex, lightweight tasks → direct with fast models
6. **Verify** — validate deliverables via automated tests and interactive UAT across ecosystem
7. **Archive** — clean planning artifacts after feature cycle completes

**Execution model:**
- Wave 1: Tasks with no dependencies (e.g., modify `shared-types`)
- Wave 2: Tasks depending on Wave 1 (e.g., `backend-api` and `frontend-web` in parallel, reading updated contracts)
- Each wave maximizes parallelism within dependency constraints

**Token optimization strategy (the "Cost Savers"):**
- Prompt caching ready: foundational context bundled at top of requests
- Diff-based editing: SEARCH/REPLACE blocks, never full file output
- State compaction: continuous compression of running history
- Semantic loading: only relevant file snippets and tool descriptions per task
- Result collection via git diffs: cheapest post-execution inspection

## Constraints

- **Tech stack**: TypeScript / Node.js — follows GSD pattern, npm-distributed CLI
- **Execution model**: Meta-orchestrator only — delegates to Claude Code and Codex, does not call LLM APIs directly for code generation
- **Token budget**: Every architectural decision must minimize token consumption
- **v1 adapters**: Claude Code and Codex only — adapter layer must be pluggable for future tools
- **Single user**: No multi-user, no auth, no team features in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Meta-orchestrator, not standalone runtime | Ptah plans and tracks; existing tools (Claude Code, Codex) execute. Avoids rebuilding code generation. | — Pending |
| Progressive ecosystem learning | Repos registered one at a time, Ptah builds understanding. Not "configure everything upfront." | — Pending |
| Auto-detect + confirm contracts | Ptah discovers cross-repo relationships (APIs, schemas) automatically, then confirms with user. Balances automation with correctness. | — Pending |
| Tiered model routing | Heavyweight tasks → Claude Code/Codex agents. Lightweight tasks → direct via fast models (Haiku/Flash) with SEARCH/REPLACE. Optimizes cost. | — Pending |
| Git diffs for result collection | After downstream tool executes, Ptah reads git diffs to understand what changed. Cheapest token-wise vs parsing verbose tool output. | — Pending |
| TypeScript/Node.js | Same ecosystem as GSD reference, npm distribution, excellent async for parallel orchestration. | — Pending |
| Granular permission gates | User configures per-action policies (commit, push, branch, etc). Respects user's comfort level with automation. | — Pending |
| Artifact archival post-cycle | Planning artifacts archived after feature cycle completes. Prevents stale docs polluting future context. | — Pending |

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
*Last updated: 2026-04-03 after initialization*
