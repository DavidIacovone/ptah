# Requirements: Ptah

**Defined:** 2026-04-06
**Core Value:** Enable precise, cross-repository changes by extending AI coding tools with multi-repo awareness, contract discovery, and dependency-aware execution.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Workspace Foundation

- [ ] **INIT-01**: User can install Ptah via `npx ptah` or `npm install -g ptah`
- [ ] **INIT-02**: User can create a new project with `ptah init <name>`, creating a project directory in `~/.ptah/projects/<name>/`
- [ ] **INIT-03**: User can specify a custom global location for `.ptah/` (default: `~/.ptah/`)
- [ ] **INIT-04**: User can view available Ptah commands by invoking `ptah:help`
- [ ] **INIT-05**: Per-project config supports: CLI tool (Gemini CLI / Claude Code), max tokens per session, auto-accept vs safe mode
- [ ] **INIT-06**: State tracking persists across sessions via project `STATE.json` — user can resume work after restarting AI tool
- [ ] **INIT-07**: User can list all projects with `ptah list` and switch between them

### Ecosystem Management

- [ ] **REPO-01**: User can register a repository with `ptah:register <path> --role <role>`, storing a profile in `.ptah/repos/`
- [ ] **REPO-02**: User can register repos progressively (one at a time, workspace grows incrementally)
- [ ] **REPO-03**: `ptah:learn` scans registered repos to discover structure (framework, language, directory layout, key files)
- [ ] **REPO-04**: Repo profiles include: path, role, framework, language, key directories, exports summary

### Contract Discovery

- [ ] **CONT-01**: `ptah:discover` auto-detects cross-repo contracts (API endpoints, shared types, schema definitions) across all registered repos
- [ ] **CONT-02**: Discovered contracts are presented to user with confidence scores for confirmation
- [ ] **CONT-03**: Confirmed contracts are stored in `.ptah/CONTRACTS.md` with provider repo, consumer repos, and type
- [ ] **CONT-04**: Contract registry is queryable — user can ask "what connects frontend to backend?"

### Planning

- [ ] **PLAN-01**: User can invoke `ptah:plan` with a natural language description of the desired change
- [ ] **PLAN-02**: Ptah identifies affected repos from the description + ecosystem context + contract registry
- [ ] **PLAN-03**: Ptah generates atomic task files (one per repo per change unit) in `.ptah/plans/current/tasks/`
- [ ] **PLAN-04**: Tasks are ordered into dependency-aware waves via DAG builder helper script
- [ ] **PLAN-05**: Generated plan (`.ptah/plans/current/PLAN.md`) is presented to user for approval before execution
- [ ] **PLAN-06**: Plan includes wave assignments — which tasks run in parallel, which depend on prior waves

### Execution

- [ ] **EXEC-01**: User can invoke `ptah:execute` to begin executing an approved plan
- [ ] **EXEC-02**: Tasks execute in wave order — all Wave 1 tasks complete before Wave 2 begins
- [ ] **EXEC-03**: For each task, the AI navigates to the correct repo and makes the specified changes
- [ ] **EXEC-04**: After each task, git diffs are collected to record what changed
- [ ] **EXEC-05**: Execution progress is tracked in `.ptah/STATE.json` (tasks completed, current wave, failures)
- [ ] **EXEC-06**: Failed tasks are reported with context (repo, task, error) without blocking other independent tasks in the same wave

### Verification

- [ ] **VRFY-01**: User can invoke `ptah:verify` after execution to validate completed work
- [ ] **VRFY-02**: Verification checks that all planned tasks were executed (diffs exist for each task)
- [ ] **VRFY-03**: Verification runs available tests in affected repos and reports results
- [ ] **VRFY-04**: User can mark verification as passed or request re-execution of failed tasks

### Status & Lifecycle

- [ ] **STAT-01**: User can invoke `ptah:status` to see workspace state: registered repos, active plan, execution progress
- [ ] **STAT-02**: Lifecycle states (idle → planning → planned → executing → verifying → complete) are enforced — can't execute without a plan
- [ ] **STAT-03**: User can reset to previous lifecycle state if needed (e.g., re-plan after failed execution)

### Tool Integration

- [ ] **TOOL-01**: Ptah skills work in Claude Code (SKILL.md format, discovered automatically)
- [ ] **TOOL-02**: Ptah skills work in Gemini CLI (appropriate format for Gemini CLI skill discovery)
- [ ] **TOOL-03**: Core logic (state schemas, templates, helper scripts) is shared between both tool integrations
- [ ] **TOOL-04**: Installation is npm/npx based — `npx ptah` or `npm install -g ptah`

### Permissions

- [ ] **PERM-01**: User can configure per-action permission levels in `.ptah/config.json` (auto, confirm, deny)
- [ ] **PERM-02**: Actions covered: file_edit, git_commit, git_push, branch_create, branch_delete
- [ ] **PERM-03**: Default permission level is `confirm` for destructive actions (commit, push, delete)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Optimization

- **OPT-01**: Multi-model task routing — route tasks to cheapest capable model based on complexity
- **OPT-02**: State compaction — compress execution history to prevent context growth
- **OPT-03**: Semantic file loading — AST-based context selection for minimal token usage per task
- **OPT-04**: Prompt caching alignment — structure context for LLM provider cache hits

### Extended Tool Support

- **XTOOL-01**: Ptah skills work in Cursor AI
- **XTOOL-02**: Ptah skills work in Windsurf/Cascade
- **XTOOL-03**: Ptah skills work in Goose

### Advanced Features

- **ADV-01**: Artifact archival — auto-clean planning artifacts after feature cycle completes
- **ADV-02**: Workspace templates — common multi-repo patterns (frontend+backend, microservices)
- **ADV-03**: Cross-workspace coordination — orchestrating work across multiple Ptah workspaces

## Out of Scope

| Feature | Reason |
|---------|--------|
| Standalone CLI binary | Extension model is simpler and meets users where they are |
| Direct LLM API calls | Leverages host AI tool — no need to wrap APIs |
| GUI/web dashboard | Runs inside existing AI tools |
| Team/multi-user | Single-developer power tool (v1) |
| CI/CD integration | Not a deployment pipeline tool |
| Monorepo creation | Works with existing repos as-is |
| Real-time collaboration | Distributed state is enormously complex |
| Auto-merging PRs | Dangerous in multi-repo context |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INIT-01 | Phase 1 | Pending |
| INIT-02 | Phase 1 | Pending |
| INIT-03 | Phase 1 | Pending |
| INIT-04 | Phase 1 | Pending |
| INIT-05 | Phase 1 | Pending |
| INIT-06 | Phase 1 | Pending |
| INIT-07 | Phase 1 | Pending |
| REPO-01 | Phase 2 | Pending |
| REPO-02 | Phase 2 | Pending |
| REPO-03 | Phase 2 | Pending |
| REPO-04 | Phase 2 | Pending |
| CONT-01 | Phase 2 | Pending |
| CONT-02 | Phase 2 | Pending |
| CONT-03 | Phase 2 | Pending |
| CONT-04 | Phase 2 | Pending |
| PLAN-01 | Phase 3 | Pending |
| PLAN-02 | Phase 3 | Pending |
| PLAN-03 | Phase 3 | Pending |
| PLAN-04 | Phase 3 | Pending |
| PLAN-05 | Phase 3 | Pending |
| PLAN-06 | Phase 3 | Pending |
| EXEC-01 | Phase 4 | Pending |
| EXEC-02 | Phase 4 | Pending |
| EXEC-03 | Phase 4 | Pending |
| EXEC-04 | Phase 4 | Pending |
| EXEC-05 | Phase 4 | Pending |
| EXEC-06 | Phase 4 | Pending |
| VRFY-01 | Phase 4 | Pending |
| VRFY-02 | Phase 4 | Pending |
| VRFY-03 | Phase 4 | Pending |
| VRFY-04 | Phase 4 | Pending |
| STAT-01 | Phase 4 | Pending |
| STAT-02 | Phase 4 | Pending |
| STAT-03 | Phase 4 | Pending |
| TOOL-01 | Phase 5 | Pending |
| TOOL-02 | Phase 5 | Pending |
| TOOL-03 | Phase 5 | Pending |
| TOOL-04 | Phase 5 | Pending |
| PERM-01 | Phase 5 | Pending |
| PERM-02 | Phase 5 | Pending |
| PERM-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after Phase 1 discuss — npx install, multi-project model*
