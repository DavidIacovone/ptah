# Feature Research

**Domain:** Skill-based meta-orchestration / multi-repo AI coding coordination
**Researched:** 2026-04-03 | **Updated:** 2026-04-06 (pivot to extension model)
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Skill-based commands (`ptah:init`, `ptah:plan`, `ptah:execute`) | Users need clear entry points | LOW | Markdown skill files per command |
| npm/npx installation | Users expect `npx ptah` or `npm install -g ptah` | LOW | npm package with `bin` entry |
| Multi-project support | Users work on multiple ecosystems | MEDIUM | `ptah init <name>` creates independent projects in `~/.ptah/projects/` |
| Repo registration with role assignment | Must know which repos exist and their purpose | MEDIUM | Progressive — register one at a time |
| Task plan generation | Core orchestrator function — break work into tasks | HIGH | Atomic plans mapped to repos |
| Task execution with wave ordering | Users need to see what's happening | MEDIUM | Skill instructions guide AI through waves |
| Git-aware operations | Every dev tool respects git state | MEDIUM | simple-git helper for diff reading |
| Config support | Users expect persistent settings | LOW | `.ptah/config.json` |
| Dry-run / preview mode | Users need to preview before destructive actions | LOW | Show plan without executing |
| Error reporting with context | Failures must be debuggable | MEDIUM | Skill instructions for structured error output |
| Dual-tool support | Must work in both Gemini CLI and Claude Code | MEDIUM | Shared core, tool-specific skill entry points |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cross-repo contract discovery | Auto-detects APIs, schemas, shared types across repos — no manual mapping | HIGH | Helper script scans repos, builds contract registry |
| Dependency-aware wave execution | Tasks execute in order respecting cross-repo dependencies | HIGH | DAG-based topological sort encoded in plan |
| Central ecosystem map | One `.ptah/` workspace understands all registered repos | MEDIUM | Progressive learning, persistent state |
| Diff-based result collection | Reads git diffs instead of parsing verbose tool output — cheapest inspection | MEDIUM | simple-git + diff parser helper |
| Discuss → Plan → Execute → Verify lifecycle | Structured workflow prevents ad-hoc changes | MEDIUM | State machine via skill instructions + state files |
| Granular permission gates | Per-action user policies (commit: approval_required, file_edit: auto) | MEDIUM | Policy config in `.ptah/config.json` |
| Shared core, multi-tool skills | Same planning intelligence works in Gemini CLI and Claude Code | HIGH | Tool-agnostic state + tool-specific skills |
| Artifact archival | Auto-cleans planning artifacts after feature cycle completes | LOW | Lifecycle hooks post-verification |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Standalone CLI binary (without extension model) | "I want a separate heavyweight tool" | AI tool already handles execution. Heavy CLI adds subprocess management with no value | Thin CLI for project mgmt + skills for orchestration |
| Direct LLM API calls | "Why not call the API directly?" | AI tool already handles this. Adding API calls duplicates functionality and adds auth/billing complexity | Leverage host AI tool |
| GUI/web dashboard | "I want to see everything visually" | Doubles codebase, different skillset | AI tool's native output + state files for persistence |
| Auto-merging PRs | "Just merge it when tests pass" | Extremely dangerous in multi-repo context — cascading failures | Create PRs with context, require human merge |
| Real-time collaboration | "Multiple devs using Ptah simultaneously" | Distributed state management across repos is enormously complex | Single-user with clear artifact handoff |
| Multi-model routing (v1) | "Route tasks to cheapest model" | No baseline to optimize against yet. Premature complexity | Defer to v1.x after measuring token costs |
| State compaction (v1) | "Compress history automatically" | Adds complexity before we know if it's needed | Defer to v1.x |

## Feature Dependencies

```
[Skill Installation]
    └──requires──> [Workspace Init ( ptah:init)]
                       └──requires──> [Repo Registration (ptah:register)]
                                          └──requires──> [Ecosystem Learning]
                                                             └──requires──> [Contract Discovery]

[Task Planning (ptah:plan)]
    └──requires──> [Ecosystem Learning] (needs repo understanding)
    └──requires──> [Contract Discovery] (needs cross-repo context)

[Wave Execution (ptah:execute)]
    └──requires──> [Task Planning] (needs atomic plans with DAG)
    └──requires──> [Permission Gates] (needs trust config)

[Verification (ptah:verify)]
    └──requires──> [Wave Execution] (needs completed tasks to verify)

[Dual-tool Support]
    └──requires──> [Shared Core] (state schemas, templates, helpers)
    └──requires──> [Tool-specific Skills] (per-tool skill format)
```

## MVP Definition

### Launch With (v1)

- [ ] npm package installable via `npx ptah` or `npm install -g ptah`
- [ ] Thin CLI for project management: `ptah init`, `ptah list`
- [ ] Multi-project model — independent projects in `~/.ptah/projects/`
- [ ] Per-project config — CLI tool, max tokens, auto-accept vs safe mode
- [ ] Skill files for Gemini CLI and Claude Code
- [ ] `ptah:register` — repo registration with role assignment
- [ ] `ptah:learn` — ecosystem learning (scan repos, discover structure)
- [ ] `ptah:discover` — auto-detect cross-repo contracts with confirmation
- [ ] `ptah:plan` — task plan generation with DAG ordering
- [ ] `ptah:execute` — dependency-aware wave execution
- [ ] `ptah:verify` — verification of completed work
- [ ] `ptah:status` — project and progress status
- [ ] Diff-based result collection via git
- [ ] Permission gates (auto-accept / safe mode per project)
- [ ] State tracking with per-project Markdown + JSON artifacts
- [ ] Helper scripts for ecosystem scanning and contract discovery

### Add After Validation (v1.x)

- [ ] Additional AI tool support (Cursor, Windsurf, etc.) — trigger: user demand
- [ ] Multi-model task routing — trigger: token costs become user concern
- [ ] State compaction engine — trigger: long sessions hit context limits
- [ ] Semantic file loading — trigger: large repos consume too many tokens
- [ ] Prompt caching alignment — trigger: optimizing per-request costs

## Competitor Feature Analysis

| Feature | GSD (reference) | Aider | Claude Code | Ptah (our plan) |
|---------|----------------|-------|-------------|-----------------|
| Multi-repo aware | No (single repo) | No (single repo) | No (single repo) | **Yes — core differentiator** |
| Delivery model | Skill-based extension | Standalone CLI | Standalone CLI + IDE | **npm package + skill extension** |
| Tools supported | Claude Code | Multi-model | Claude only | **Gemini CLI + Claude Code** |
| Contract tracking | Manual | None | None | **Auto-discovery + registry** |
| Task orchestration | Phase-based | File-level edits | Subagent spawning | **Cross-repo dependency waves** |
| Permission model | YOLO / Interactive | Auto-commit toggle | Approval per action | **Granular per-action policies** |

## Sources

- GSD framework — reference architecture and skill-based delivery model
- Claude Code SKILL.md format — skill discovery and execution patterns
- Aider, Goose, OpenCode documentation — competitor analysis
- Industry analysis of multi-agent orchestration patterns (2025-2026)

---
*Feature research for: Skill-based meta-orchestration with npm package CLI*
*Updated: 2026-04-06 (npx install, multi-project model)*
