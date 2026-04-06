# Phase 1: Workspace Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 01-workspace-foundation
**Areas discussed:** .ptah/ location, skill file structure, config & state granularity, helper script runtime

---

## .ptah/ Location

| Option | Description | Selected |
|--------|-------------|----------|
| Inside one repo's root | `.ptah/` lives inside a single repo | |
| Shared parent directory | `.ptah/` lives in a parent directory containing all repos | |
| User-specified or default global | User can specify a location; default is `~/.ptah/` | ✓ |

**User's choice:** User-specified or default global location
**Notes:** User clarified that `ptah init` creates projects, and users can have many projects. This led to the multi-project model with `~/.ptah/projects/<name>/` structure.

---

## Skill File Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Agent's discretion | Agent chooses the best approach based on what works for both tools | ✓ |

**User's choice:** Agent's discretion
**Notes:** User deferred to agent to design SKILL.md format optimized for dual-tool compatibility.

---

## Config & State Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal config | Just permission levels and default roles | |
| Project-scoped config | CLI tool, max tokens, auto-accept vs safe mode per project | ✓ |

**User's choice:** Per-project config with specific fields
**Notes:** User specified three key config fields: (1) which CLI tool is used for the project (Gemini CLI / Claude Code), (2) max tokens per session, (3) auto-accept vs safe mode.

---

## Helper Script Runtime / Installation

| Option | Description | Selected |
|--------|-------------|----------|
| Git clone | Clone repo, run `npm install` for helper script dependencies | |
| npx/npm install | Distribute as npm package, install via `npx ptah` | ✓ |
| Pre-compiled JS | Build TypeScript to JS, distribute compiled | |

**User's choice:** npx/npm install
**Notes:** User wants Ptah installable via `npx`. This means npm package with `bin` entry. User further clarified the flow: (1) install Ptah via npx, (2) use `ptah init <name>` to create projects, (3) projects manage repos and mappings. This established the thin CLI + skill extension hybrid model.

---

## Agent's Discretion

- Skill file internal structure and SKILL.md format (user said "choose the best approach yourself based on what works")
- Arg parsing library choice for thin CLI
- Template file contents (defaults for config.json, ECOSYSTEM.md, etc.)
- Error handling patterns

## Deferred Ideas

- None — discussion stayed within phase scope. All orchestration commands (register, plan, execute, verify, status) acknowledged as belonging to Phases 2-5.
