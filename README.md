# Ptah

**Meta-orchestration framework for cross-repository AI coding coordination.**

Ptah extends AI coding tools (Gemini CLI, Claude Code) with skills for managing changes across multiple interconnected repositories. It understands your ecosystem's dependency graph, generates wave-based execution plans, and coordinates the AI tool through cross-repo tasks.

## Installation

```bash
# Install globally
npm install -g ptah

# Or use directly with npx
npx ptah init my-project
```

**Requirements:** Node.js 18+

## Quick Start

```bash
# 1. Create a project
ptah init my-ecommerce --cli-tool gemini-cli

# 2. Open your AI tool and use skill commands
# Inside Gemini CLI or Claude Code:
ptah:register ./frontend-web --role frontend
ptah:register ./backend-api --role backend
ptah:learn
ptah:discover
ptah:plan
ptah:execute
```

## How It Works

Ptah operates as a **skill extension** for AI coding tools. It provides:

1. **A thin CLI** (`ptah init`, `ptah list`) for project management
2. **Skill files** that AI tools discover and activate on demand
3. **Helper scripts** for computational work (scanning, dependency analysis)

```
┌──────────────────────────────────┐
│  AI Tool (Gemini CLI / Claude)   │
│                                  │
│  ptah:plan → ptah:execute → ...  │
│       │           │              │
│  ┌────┴───────────┴────┐        │
│  │  Helper Scripts     │        │
│  │  (scan, DAG, etc.)  │        │
│  └─────────┬───────────┘        │
│       ┌────┴────┐               │
│       │ ~/.ptah │               │
│       └─────────┘               │
└──────────────────────────────────┘
       │          │          │
   [Repo A]   [Repo B]   [Repo C]
```

## Project Structure

```
~/.ptah/
├── config.json                    # Global settings
└── projects/
    └── my-project/
        ├── config.json            # Project config (CLI tool, tokens, mode)
        ├── STATE.json             # Lifecycle state + progress
        ├── ECOSYSTEM.md           # Registered repos and relationships
        ├── repos/                 # Per-repo profiles
        ├── plans/                 # Generated task plans
        └── logs/                  # Execution logs
```

## Commands

### CLI Commands

| Command | Description |
|---------|-------------|
| `ptah init <name>` | Create a new project |
| `ptah list` | List all projects |
| `ptah help` | Show help |

### AI Tool Skills

| Skill | Description |
|-------|-------------|
| `ptah:help` | Command reference |
| `ptah:init` | Interactive setup |
| `ptah:status` | Project status |
| `ptah:register` | Register a repo |
| `ptah:learn` | Scan ecosystem |
| `ptah:discover` | Find contracts |
| `ptah:plan` | Generate plans |
| `ptah:execute` | Execute plans |
| `ptah:verify` | Verify work |

## Configuration

Each project has a `config.json`:

```json
{
  "cli_tool": "gemini-cli",
  "max_tokens": 200000,
  "mode": "safe"
}
```

| Setting | Options | Default |
|---------|---------|---------|
| `cli_tool` | `gemini-cli`, `claude-code` | `gemini-cli` |
| `max_tokens` | Any positive number | `200000` |
| `mode` | `safe`, `auto-accept` | `safe` |

## License

MIT
