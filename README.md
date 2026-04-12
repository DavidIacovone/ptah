# Ptah

> ⚠️ **This version is still a work in progress. It might not work as expected.**

**Meta-orchestration framework for cross-repository AI coding coordination.**

Ptah extends AI coding tools (Gemini CLI, Claude Code) with skills for managing changes across multiple interconnected repositories. It understands your ecosystem's dependency graph, generates wave-based execution plans, and coordinates the AI tool through cross-repo tasks.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Commands](#commands)
  - [Standalone CLI Commands](#standalone-cli-commands)
  - [AI-Only Skill Commands](#ai-only-skill-commands)
- [Workflow Guide](#workflow-guide)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [License](#license)

## Installation

```bash
# Install globally
npm install -g ptah-cli

# Or use directly with npx
npx ptah-cli init my-project
```

**Requirements:** Node.js 18+

After installation the `ptah` binary is available globally:

```bash
ptah --version
ptah help
```

## Quick Start

```bash
# 1. Create a project
ptah init my-ecommerce --cli-tool gemini-cli

# 2. Register your repositories
ptah register ./frontend-web --role frontend
ptah register ./backend-api --role backend
ptah register ./shared-types --role shared-lib

# 3. Analyze the ecosystem
ptah learn
ptah discover

# 4. Create a plan and assign execution waves
ptah plan my-ecommerce \
  --description "Add user avatar support" \
  --tasks '[{"id":"t1","repo":"shared-types","description":"Add avatar field to User type"},{"id":"t2","repo":"backend-api","description":"Add upload endpoint","depends_on":["t1"]}]'

ptah build-dag my-ecommerce

# 5. Open your AI tool (Gemini CLI or Claude Code)
# and use skill commands for execution:
#   ptah:execute
#   ptah:verify
```

## How It Works

Ptah operates as a **skill extension** for AI coding tools. It provides:

1. **A standalone CLI** (`ptah init`, `ptah plan`, `ptah build-dag`, etc.) — runs from any terminal, no AI tool required
2. **Skill files** (`ptah:execute`, `ptah:verify`, etc.) — instruction documents that AI tools discover and follow, used for tasks that require AI reasoning
3. **Helper libraries** for computational work (repository scanning, contract discovery, DAG building)

```
┌──────────────────────────────────┐
│  AI Tool (Gemini CLI / Claude)   │
│                                  │
│  ptah:execute → ptah:verify → …  │  ← AI-only skills
│       │           │              │
│  ┌────┴───────────┴────┐        │
│  │  Ptah CLI Engine    │        │  ← standalone commands
│  │  (scan, DAG, etc.)  │        │
│  └─────────┬───────────┘        │
│       ┌────┴────┐               │
│       │ ~/.ptah │               │
│       └─────────┘               │
└──────────────────────────────────┘
       │          │          │
   [Repo A]   [Repo B]   [Repo C]
```

### Lifecycle

Every Ptah project follows a linear lifecycle:

```
idle → learning → discovering → planning → planned → executing → verifying → complete
```

Each command advances the project through these stages, and `STATE.json` always reflects where you are.

## Project Structure

```
~/.ptah/
├── config.json                    # Global settings (default CLI tool, paths)
└── projects/
    └── my-project/
        ├── config.json            # Project config (CLI tool, tokens, mode)
        ├── STATE.json             # Lifecycle state + task progress
        ├── ECOSYSTEM.md           # Registered repos and relationships
        ├── CONTRACTS.md           # Discovered cross-repo contracts
        ├── repos/                 # Per-repo profiles (JSON)
        │   ├── frontend-web.json
        │   └── backend-api.json
        ├── plans/                 # Generated task plans (JSON)
        │   └── plan-1712345678.json
        └── logs/                  # Execution logs
```

## Commands

### Standalone CLI Commands

These commands run from **any terminal** — no AI tool required. They handle project setup, ecosystem analysis, and plan generation.

| Command | Description |
|---------|-------------|
| `ptah init <name>` | Create a new project |
| `ptah list` | List all projects |
| `ptah register <path>` | Register a repository with the active project |
| `ptah learn` | Scan all registered repos for structure and exports |
| `ptah discover` | Detect cross-repo dependency contracts |
| `ptah plan <project> --description "..." --tasks '[...]'` | Create a task plan |
| `ptah build-dag <project>` | Assign dependency-aware execution waves |
| `ptah help` | Show help |
| `ptah --version` | Show version |

> **Note:** The `ptah:` prefix also works for these commands (e.g. `ptah:learn`, `ptah:plan`), so AI tools can invoke them through the same CLI.

### AI-Only Skill Commands

These commands are designed to be run **inside an AI coding tool** (Gemini CLI or Claude Code). They require AI reasoning and cannot be used from a plain terminal.

| Skill | Description | Status |
|-------|-------------|--------|
| `ptah:init` | Interactive project setup guide (AI-guided) | ✅ Available |
| `ptah:help` | Command reference | ✅ Available |
| `ptah:status` | Show workspace status and lifecycle stage | ✅ Available |
| `ptah:execute` | Execute tasks wave by wave across repos | 🚧 Phase 4 |
| `ptah:verify` | Verify completed work against plan expectations | 🚧 Phase 5 |

## Workflow Guide

A typical Ptah workflow follows these steps:

### 1. Initialize & Register

```bash
# Create a project
ptah init my-app --cli-tool gemini-cli

# Register each repo in your ecosystem
ptah register ./shared-types --role shared-lib
ptah register ./backend-api  --role backend
ptah register ./frontend-web --role frontend
```

### 2. Learn & Discover

```bash
# Scan repositories for frameworks, languages, and exports
ptah learn

# Auto-detect dependency contracts between repos
ptah discover --generate   # also creates CONTRACTS.md
```

### 3. Plan

Create a plan with a description and typed tasks targeting specific repos:

```bash
ptah plan my-app \
  --description "Add user avatar support" \
  --tasks '[
    {"id":"t1","repo":"shared-types","description":"Add avatar field to User type"},
    {"id":"t2","repo":"backend-api","description":"Add /avatar upload endpoint","depends_on":["t1"]},
    {"id":"t3","repo":"frontend-web","description":"Render avatar component","depends_on":["t1"]}
  ]'
```

Or, inside your AI tool, use the skill for natural-language decomposition:

```
ptah:plan

"Add a user avatar field to the shared types, implement the upload
 endpoint in the backend, and render the avatar in the frontend."
```

### 4. Build DAG & Execute

```bash
# Assign parallel execution waves
ptah build-dag my-app
```

This produces wave assignments using Kahn's topological sort:

```
Wave 1: t1 (shared-types)    ← no dependencies, runs first
Wave 2: t2 (backend-api)     ← depends on t1
         t3 (frontend-web)   ← depends on t1, parallel with t2
```

Then, inside your AI tool, execute each wave:

```
ptah:execute
```

### 5. Verify

```
ptah:verify
```

## Configuration

### Project Config (`config.json`)

Each project has a `config.json` controlling its behavior:

```json
{
  "cli_tool": "gemini-cli",
  "max_tokens": 200000,
  "mode": "safe",
  "created_at": "2026-04-03T12:00:00Z",
  "ptah_version": "0.1.0"
}
```

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| `cli_tool` | `gemini-cli`, `claude-code` | `gemini-cli` | AI tool that drives this project |
| `max_tokens` | Any positive number | `200000` | Context window token budget |
| `mode` | `safe`, `auto-accept` | `safe` | `safe` confirms each action; `auto-accept` runs unattended |

### Global Config (`~/.ptah/config.json`)

Machine-wide defaults:

```json
{
  "default_cli_tool": "gemini-cli",
  "ptah_home": "~/.ptah",
  "ptah_install_path": "/path/to/ptah"
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PTAH_HOME` | Override the default `~/.ptah` directory |

## Architecture

### Source Layout

```
src/
├── cli.ts                         # CLI entrypoint and command router
├── commands/
│   ├── init.ts                    # ptah init
│   ├── list.ts                    # ptah list
│   ├── register.ts                # ptah register (role/framework auto-detection)
│   ├── learn.ts                   # ptah learn (deep repo scanning)
│   ├── discover.ts                # ptah discover (contract detection)
│   ├── plan.ts                    # ptah plan (task decomposition)
│   └── build-dag.ts               # ptah build-dag (wave assignment)
└── lib/
    ├── paths.ts                   # Filesystem path resolution
    ├── schemas.ts                 # Zod schemas for all data structures
    ├── state.ts                   # Validated state read/write operations
    └── ecosystem/
        ├── detectors.ts           # Framework/language detection patterns
        ├── scanner.ts             # Repository structure scanner
        ├── discovery.ts           # Cross-repo contract discovery
        └── dag.ts                 # DAG builder (Kahn's algorithm)
```

### Key Design Decisions

- **Zod-validated I/O** — Every read from and write to disk goes through Zod schema validation, catching malformed data immediately.
- **Deterministic DAG** — Kahn's algorithm ensures repeatable, deterministic wave assignment.
- **Contract-based enrichment** — Only *confirmed* contracts generate implicit task dependencies, avoiding false-positive ordering.
- **Skill-first architecture** — Complex orchestration logic (execution, verification) lives in skill files that AI tools execute natively. The CLI handles everything that doesn't need AI reasoning.

## License

MIT
