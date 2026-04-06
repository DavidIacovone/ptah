# Roadmap: Ptah

## Overview

Ptah ships in 5 phases, progressing from workspace foundation through ecosystem awareness, planning intelligence, execution capability, and finally dual-tool polish. Each phase delivers testable functionality — by Phase 4, a developer can coordinate cross-repo changes end-to-end. Phase 5 hardens dual-tool support and adds permission gates.

## Phases

- [ ] **Phase 1: Workspace Foundation** — Skill infrastructure, `.ptah/` state management, init + help commands
- [ ] **Phase 2: Ecosystem Awareness** — Repo registration, structure scanning, cross-repo contract discovery
- [ ] **Phase 3: Planning Engine** — Task plan generation, DAG builder, dependency-aware ordering
- [ ] **Phase 4: Execution & Verification** — Wave execution, diff collection, verification flow, status tracking
- [ ] **Phase 5: Dual-Tool Support & Polish** — Gemini CLI + Claude Code integration testing, permissions, installation docs

## Phase Details

### Phase 1: Workspace Foundation
**Goal**: Establish the npm package, thin CLI, project management, state patterns, and skill infrastructure that all subsequent phases depend on
**Depends on**: Nothing (first phase)
**Requirements**: INIT-01, INIT-02, INIT-03, INIT-04, INIT-05, INIT-06, INIT-07
**Success Criteria** (what must be TRUE):
  1. User can install Ptah via `npx ptah` or `npm install -g ptah`
  2. User can create a project with `ptah init <name>` and a project directory is created in `~/.ptah/projects/<name>/` with config, state, and template files
  3. User can specify a custom location for the global `.ptah/` directory
  4. User can list all projects with `ptah list`
  5. Per-project config supports CLI tool, max tokens, auto-accept vs safe mode
  6. Config and state files use validated schemas (zod) and persist across AI tool sessions
  7. User can invoke `ptah:help` and see available Ptah commands with descriptions
  8. Helper script infrastructure works — `tsx` can execute TypeScript scripts from skill instructions
**Plans**: TBD

Plans:
- [ ] 01-01: npm package scaffolding — package.json with bin entry, tsconfig, CLI entrypoint, skill directory layout
- [ ] 01-02: Project management — `ptah init`, `ptah list`, `~/.ptah/` global home, per-project directory structure
- [ ] 01-03: State management — per-project config.json, STATE.json, zod schemas, validation
- [ ] 01-04: Core skills — `ptah:help` skill file with helper script integration

### Phase 2: Ecosystem Awareness
**Goal**: Enable Ptah to understand the developer's multi-repo ecosystem — register repos, learn their structure, and discover cross-repo contracts
**Depends on**: Phase 1
**Requirements**: REPO-01, REPO-02, REPO-03, REPO-04, CONT-01, CONT-02, CONT-03, CONT-04
**Success Criteria** (what must be TRUE):
  1. User can register repos progressively with `ptah:register` and see profiles in `.ptah/repos/`
  2. `ptah:learn` scans repos and produces accurate profiles (framework, language, key directories)
  3. `ptah:discover` finds real cross-repo contracts (APIs, types, schemas) with confidence scores
  4. User can confirm/reject discovered contracts, and confirmed ones appear in `.ptah/CONTRACTS.md`
**Plans**: TBD

Plans:
- [ ] 02-01: Repo registration — `ptah:register` skill, repo profile format, ecosystem map
- [ ] 02-02: Ecosystem scanner — `scan-repo.ts` helper, structure discovery, profile generation
- [ ] 02-03: Contract discovery — `detect-contracts.ts` helper, cross-repo analysis, `ptah:discover` skill

### Phase 3: Planning Engine
**Goal**: Generate dependency-aware task plans that decompose a cross-repo change into atomic, ordered steps
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06
**Success Criteria** (what must be TRUE):
  1. User can describe a change in natural language and `ptah:plan` identifies affected repos
  2. Atomic task files are generated in `.ptah/plans/current/tasks/` with clear repo assignments
  3. Tasks are ordered into waves via DAG builder — foundation repos first, consumers later
  4. User can review and approve/reject the generated plan before execution
**Plans**: TBD

Plans:
- [ ] 03-01: Plan generation — `ptah:plan` skill, task decomposition logic, plan templates
- [ ] 03-02: DAG builder — `build-dag.ts` helper, dependency analysis, wave assignment, topological sort

### Phase 4: Execution & Verification
**Goal**: Execute approved plans wave-by-wave across repos, collect results, and verify completeness
**Depends on**: Phase 3
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, VRFY-01, VRFY-02, VRFY-03, VRFY-04, STAT-01, STAT-02, STAT-03
**Success Criteria** (what must be TRUE):
  1. `ptah:execute` runs tasks in wave order — all Wave 1 tasks complete before Wave 2
  2. AI navigates to correct repo for each task and makes specified changes
  3. Git diffs are collected per task and execution progress updates `STATE.json`
  4. `ptah:verify` checks that all tasks produced diffs and runs tests in affected repos
  5. `ptah:status` shows accurate workspace state (repos, plan, progress, lifecycle)
**Plans**: TBD

Plans:
- [ ] 04-01: Wave executor — `ptah:execute` skill, wave-by-wave flow, repo navigation, diff collection
- [ ] 04-02: Verification & status — `ptah:verify` skill, `ptah:status` skill, `collect-diffs.ts` helper, lifecycle enforcement

### Phase 5: Dual-Tool Support & Polish
**Goal**: Ensure Ptah works reliably in both Gemini CLI and Claude Code, add permission gates, and create installation documentation
**Depends on**: Phase 4
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, PERM-01, PERM-02, PERM-03
**Success Criteria** (what must be TRUE):
  1. All Ptah skills work correctly in Claude Code (SKILL.md format)
  2. All Ptah skills work correctly in Gemini CLI (appropriate format)
  3. Permission gates enforce configured policies — destructive actions require confirmation by default
  4. Installation is documented for both tools — user can go from zero to working in <5 minutes
**Plans**: TBD

Plans:
- [ ] 05-01: Claude Code integration — test all skills, fix tool-specific issues, installation docs
- [ ] 05-02: Gemini CLI integration — adapt skill format, test all skills, installation docs
- [ ] 05-03: Permission engine — permission config schema, policy enforcement in skill instructions

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Workspace Foundation | 0/4 | Not started | - |
| 2. Ecosystem Awareness | 0/3 | Not started | - |
| 3. Planning Engine | 0/2 | Not started | - |
| 4. Execution & Verification | 0/2 | Not started | - |
| 5. Dual-Tool Support & Polish | 0/3 | Not started | - |
