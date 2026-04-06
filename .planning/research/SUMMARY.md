# Project Research Summary

**Project:** Ptah
**Domain:** Skill-based meta-orchestration / multi-repo AI coding coordination
**Researched:** 2026-04-03 | **Updated:** 2026-04-06 (npx install, multi-project model)
**Confidence:** HIGH

## Executive Summary

Ptah is a skill-based meta-orchestration framework that extends AI coding tools (Gemini CLI, Claude Code) with cross-repository coordination capabilities. It installs via `npx ptah` as an npm package, providing a thin CLI for project management (`ptah init`, `ptah list`) and skill files that AI tools discover and execute. Each project manages its own repos, contracts, and plans in `~/.ptah/projects/<name>/`. Helper scripts handle computational heavy lifting.

The design uses a hybrid model: thin CLI for installation and project scaffolding, plus Markdown skill files for orchestration commands. This gives the ease of `npx` installation while keeping the core execution inside AI tools where it belongs. The recommended approach uses TypeScript helper scripts for computation (scanning, DAG building, diff parsing), and file-based state for persistence.

The primary risks are skill instruction drift (AI not following instructions precisely), cross-repo navigation confusion (AI losing track of which repo it's in), and dual-tool divergence (skills working differently in Gemini CLI vs Claude Code). Mitigation: keep skills short and explicit, enforce state checkpoints, test in both tools.

## Key Findings

### Recommended Stack

Dramatically simplified from standalone CLI — npm package with thin CLI + skills:

- **npm package** with `bin` entry — `npx ptah` or `npm install -g ptah`
- **Thin CLI** (TypeScript) — `ptah init`, `ptah list`, `ptah help` — project management only
- **Skill files** (Markdown) — user-facing commands, orchestration logic (run inside AI tools)
- **Helper scripts** (TypeScript on Node.js 22) — ecosystem scanning, contract detection, DAG generation
- **State files** (JSON + Markdown) — per-project in `~/.ptah/projects/<name>/`
- **Supporting libraries** — simple-git, glob, zod, yaml, diff (for helper scripts only)

**What was removed:** Commander.js (replaced by minimal arg parsing), execa, listr2, ora, cosmiconfig, p-limit, p-queue, tiktoken, tsup, oclif, and all heavy CLI framework infrastructure.

### Expected Features

**Must have (v1):**
- npm package installable via `npx ptah` or `npm install -g ptah`
- Thin CLI for project management (`ptah init <name>`, `ptah list`)
- Multi-project support — independent projects in `~/.ptah/projects/`
- Per-project config — CLI tool (Gemini CLI / Claude Code), max tokens, auto-accept vs safe mode
- Skill files for both Gemini CLI and Claude Code
- Repo registration with progressive learning (`ptah:register`, `ptah:learn`)
- Cross-repo contract auto-discovery (`ptah:discover`)
- Dependency-aware task planning (`ptah:plan`)
- Wave execution guided by skill instructions (`ptah:execute`)
- Verification flow (`ptah:verify`)
- State tracking via per-project Markdown + JSON artifacts
- Permission gates (auto-accept / safe mode per project)
- Diff-based result collection

**Defer (v1.x):**
- Additional tool support (Cursor, Windsurf)
- Multi-model task routing
- State compaction engine
- Semantic file loading

### Architecture Approach

1. **npm Package** — `npx ptah` installs thin CLI + skills + helper scripts
2. **Thin CLI** — Handles project management: `ptah init <name>`, `ptah list`
3. **Skill Files** — Markdown instructions the AI reads and follows (commands)
4. **Helper Scripts** — TypeScript for computational work (scanning, DAG building)
5. **Per-project State** — JSON + Markdown files in `~/.ptah/projects/<name>/`

The AI tool (Gemini CLI or Claude Code) IS the executor. The thin CLI only manages installation and project scaffolding. Skills guide the AI through multi-step workflows, delegating to helper scripts when computation is needed.

### Critical Pitfalls

1. **Skill instruction drift** — Keep skills short, use numbered steps, enforce state checkpoints
2. **Cross-repo navigation confusion** — Explicit repo paths, verify location after switches
3. **State file corruption** — Atomic updates, validation on startup, recoverable from git
4. **Contract discovery false positives** — Confidence scoring, cross-repo import validation
5. **Dual-tool divergence** — Test in both tools, keep instructions simple, tool-specific adaptations isolated

## Implications for Roadmap

### Phase 1: Workspace Foundation
**Delivers:** npm package scaffolding, thin CLI (`ptah init`, `ptah list`), `~/.ptah/` global directory structure, per-project config schema, state management patterns, `ptah:help` skill, basic helper script infrastructure
**Addresses:** INIT requirements (INIT-01 through INIT-07), state patterns
**Avoids:** State corruption pitfall — patterns established early

### Phase 2: Ecosystem Awareness
**Delivers:** `ptah:register` + `ptah:learn` + `ptah:discover` skills, repo scanner helper, contract detector helper, ecosystem + contract state files
**Addresses:** REPO registration, ecosystem learning, contract discovery
**Avoids:** Contract false positives — confidence filtering in helper script

### Phase 3: Planning Engine
**Delivers:** `ptah:plan` skill, DAG builder helper, task plan templates, dependency-aware ordering
**Addresses:** Task planning, DAG ordering, plan approval flow
**Avoids:** Dependency misordering — DAG builder enforces ordering computationally

### Phase 4: Execution & Verification
**Delivers:** `ptah:execute` + `ptah:verify` + `ptah:status` skills, diff collector helper, wave execution flow, verification checks
**Addresses:** Wave execution, result collection, lifecycle completion
**Avoids:** Cross-repo navigation confusion — explicit paths in task files

### Phase 5: Dual-Tool Support & Polish
**Delivers:** Gemini CLI integration testing, tool-specific adaptations, installation docs, permission gates
**Addresses:** Gemini CLI support, Claude Code support, permissions
**Avoids:** Dual-tool divergence — tested in both tools

### Phase Ordering Rationale
- Phase 1 first — state patterns prevent cascading debt
- Phase 2 before 3 — planning needs ecosystem context
- Phase 3 before 4 — execution needs plans
- Phase 5 last — polish and tool-specific testing after core works

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Massively simplified — Markdown + TypeScript helpers + JSON state |
| Features | HIGH | Clear v1 scope, well-differentiated from existing tools |
| Architecture | HIGH | GSD validates the skill-based model. Extension pattern is proven |
| Pitfalls | HIGH | New pitfalls (skill drift, dual-tool) are manageable with established patterns |

**Overall confidence:** HIGH

### Gaps to Address
- Gemini CLI skill discovery mechanism: Exact format and discovery pattern needs verification during Phase 5
- Gemini CLI command execution: How it handles `tsx` script invocations needs testing
- Claude Code SKILL.md limitations: Max skill file length, subagent support for parallel tasks

## Sources

### Primary
- GSD framework source — reference architecture for skill-based delivery
- Claude Code SKILL.md documentation — skill format and discovery
- Node.js 22 documentation — file system APIs for helper scripts

### Secondary
- Web research on multi-agent orchestration (2025-2026)
- Competitor analysis: Aider, Claude Code, Goose, OpenCode

### Tertiary
- Gemini CLI extension format — needs primary research during implementation

---
*Research completed: 2026-04-06*
*Updated: 2026-04-06 (npx install, multi-project model)*
*Ready for requirements: yes*
