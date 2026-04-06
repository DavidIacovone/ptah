---
phase: 01-workspace-foundation
plan: 04
type: execute
wave: 3
depends_on: [01, 02]
files_modified:
  - skills/ptah-init/SKILL.md
  - skills/ptah-help/SKILL.md
  - skills/ptah-status/SKILL.md
  - README.md
autonomous: true
requirements: [INIT-04, INIT-06]

must_haves:
  truths:
    - 'skills/ptah-init/SKILL.md has valid YAML frontmatter with name: ptah:init'
    - 'skills/ptah-help/SKILL.md has valid YAML frontmatter with name: ptah:help'
    - 'skills/ptah-status/SKILL.md has valid YAML frontmatter with name: ptah:status'
    - 'README.md has installation and quickstart instructions'
  artifacts:
    - path: 'skills/ptah-init/SKILL.md'
      provides: 'Skill definition for ptah:init'
      contains: 'ptah:init'
    - path: 'skills/ptah-help/SKILL.md'
      provides: 'Skill definition for ptah:help'
      contains: 'ptah:help'
    - path: 'skills/ptah-status/SKILL.md'
      provides: 'Skill definition for ptah:status'
      contains: 'ptah:status'
    - path: 'README.md'
      provides: 'Project documentation with install instructions'
      contains: 'npx ptah'
  key_links:
    - from: 'skills/ptah-init/SKILL.md'
      to: 'src/commands/init.ts'
      via: 'skill guides AI to invoke ptah init CLI'
      pattern: 'ptah init'
---

<objective>
Create skill files for Phase 1 commands and project README.

Purpose: Make ptah:init, ptah:help, and ptah:status discoverable as AI tool skills. Create README with installation, quickstart, and architecture overview. These skill files are what the AI tool (Gemini CLI / Claude Code) scans and activates when users invoke Ptah commands.

Output: 4 files — 3 skill definitions and README.
</objective>

<execution_context>
@~/.gemini/antigravity/get-shit-done/workflows/execute-plan.md
@~/.gemini/antigravity/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-workspace-foundation/01-CONTEXT.md
@.planning/phases/01-workspace-foundation/01-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ptah:help skill</name>
  <files>skills/ptah-help/SKILL.md</files>
  <read_first>.planning/research/ARCHITECTURE.md, .planning/phases/01-workspace-foundation/01-RESEARCH.md</read_first>
  <action>
Create `skills/ptah-help/SKILL.md`:

```markdown
---
name: ptah:help
description: Show available Ptah commands and usage guide. Use when the user asks about Ptah commands, needs help with Ptah, or says "ptah help".
---

<objective>
Display the complete Ptah command reference.

Output ONLY the reference content below. Do NOT add:
- Project-specific analysis
- File context or git status
- Next-step suggestions
</objective>

<process>

Display the following command reference:

## Ptah — Cross-Repo AI Orchestration

### CLI Commands (run in terminal)

| Command | Description |
|---------|-------------|
| `ptah init <name>` | Create a new Ptah project |
| `ptah list` | List all Ptah projects |
| `ptah help` | Show this help message |

**Options for `ptah init`:**
- `--location <path>` — Custom location for .ptah/ home (default: `~/.ptah`)
- `--cli-tool <tool>` — AI tool: `gemini-cli` or `claude-code` (default: `gemini-cli`)
- `--max-tokens <n>` — Max tokens per session (default: 200000)
- `--mode <mode>` — `safe` or `auto-accept` (default: `safe`)

### Skill Commands (run inside AI tool)

| Skill | Description | Status |
|-------|-------------|--------|
| `ptah:help` | Show this reference | ✓ Available |
| `ptah:init` | Interactive project setup guide | ✓ Available |
| `ptah:status` | Show workspace status | ✓ Available |
| `ptah:register` | Register a repository | 🔜 Phase 2 |
| `ptah:learn` | Scan ecosystem structure | 🔜 Phase 2 |
| `ptah:discover` | Discover cross-repo contracts | 🔜 Phase 2 |
| `ptah:plan` | Generate task plans | 🔜 Phase 3 |
| `ptah:execute` | Execute task plans | 🔜 Phase 4 |
| `ptah:verify` | Verify completed work | 🔜 Phase 4 |

### Getting Started

1. Install: `npm install -g ptah` (or use `npx ptah`)
2. Create project: `ptah init my-project`
3. Open your AI tool and start using skill commands

</process>
```
  </action>
  <acceptance_criteria>
    - `skills/ptah-help/SKILL.md` exists and has YAML frontmatter with `name: ptah:help`
    - Description field mentions "Ptah commands" and "help"
    - Content includes table of CLI commands and skill commands
    - Content includes Getting Started section
  </acceptance_criteria>
  <verify>
    <automated>test -f skills/ptah-help/SKILL.md && grep -q "name: ptah:help" skills/ptah-help/SKILL.md && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>ptah:help skill created with full command reference table.</done>
</task>

<task type="auto">
  <name>Task 2: Create ptah:init skill</name>
  <files>skills/ptah-init/SKILL.md</files>
  <read_first>src/commands/init.ts, skills/ptah-help/SKILL.md</read_first>
  <action>
Create `skills/ptah-init/SKILL.md`:

```markdown
---
name: ptah:init
description: Guide user through creating a new Ptah project. Use when the user wants to create, initialize, or set up a new multi-repo orchestration project.
---

<objective>
Guide the user through creating a new Ptah project interactively.

This skill helps users set up a new project by collecting a project name and optional configuration, then running the `ptah init` CLI command.
</objective>

<process>

## Step 1: Collect Project Information

Ask the user for:
1. **Project name** (required) — lowercase, alphanumeric with hyphens/underscores
2. **AI tool preference** (optional) — `gemini-cli` or `claude-code` (default: gemini-cli)
3. **Permission mode** (optional) — `safe` or `auto-accept` (default: safe)

## Step 2: Run Init Command

Execute the CLI command with collected parameters:

```bash
ptah init <project-name> [--cli-tool <tool>] [--mode <mode>]
```

If `ptah` is not installed globally, use:
```bash
npx ptah init <project-name> [--cli-tool <tool>] [--mode <mode>]
```

## Step 3: Confirm Success

After successful creation, report:
- Project location (typically `~/.ptah/projects/<name>/`)
- Configuration settings
- Next steps: register repositories with `ptah:register`

## Step 4: If Error

If the command fails:
- Check if project name already exists
- Verify write permissions to `~/.ptah/`
- Suggest using `--location` flag for custom path

</process>
```
  </action>
  <acceptance_criteria>
    - `skills/ptah-init/SKILL.md` exists and has YAML frontmatter with `name: ptah:init`
    - Description mentions "creating" and "project"
    - Process includes collecting project name and running CLI command
    - Error handling section included
  </acceptance_criteria>
  <verify>
    <automated>test -f skills/ptah-init/SKILL.md && grep -q "name: ptah:init" skills/ptah-init/SKILL.md && grep -q "ptah init" skills/ptah-init/SKILL.md && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>ptah:init skill created with interactive project creation guide.</done>
</task>

<task type="auto">
  <name>Task 3: Create ptah:status skill</name>
  <files>skills/ptah-status/SKILL.md</files>
  <read_first>src/lib/schemas.ts, skills/ptah-help/SKILL.md</read_first>
  <action>
Create `skills/ptah-status/SKILL.md`:

```markdown
---
name: ptah:status
description: Show the current status of a Ptah project — lifecycle state, registered repos, contracts, and plan progress. Use when the user asks about project status or wants to know what state their orchestration is in.
---

<objective>
Display the current status of a Ptah project by reading its state files.
</objective>

<process>

## Step 1: Identify Active Project

1. Run `ptah list` to see available projects
2. If multiple projects exist, ask the user which one to check
3. If only one project exists, use that one

## Step 2: Read Project State

Read the project's state files from `~/.ptah/projects/<name>/`:

1. Read `config.json` — show CLI tool, mode, max tokens
2. Read `STATE.json` — show lifecycle, repos registered, contracts discovered
3. Read `ECOSYSTEM.md` — show registered repository summary

## Step 3: Display Status

Format and display:

```
╔══════════════════════════════════════╗
║  Ptah Project: <name>               ║
╠══════════════════════════════════════╣
║  Lifecycle:   <lifecycle state>     ║
║  CLI Tool:    <gemini-cli/claude>   ║
║  Mode:        <safe/auto-accept>    ║
║  Repos:       <count> registered    ║
║  Contracts:   <count> discovered    ║
║  Plan:        <current plan or N/A> ║
╚══════════════════════════════════════╝
```

## Step 4: Suggest Next Action

Based on lifecycle state, suggest the logical next step:
- `idle` → "Register repos with `ptah:register`"
- `learning` → "Run `ptah:discover` to find contracts"
- `discovering` → "Run `ptah:plan` to create task plan"
- `planned` → "Run `ptah:execute` to start execution"
- `executing` → "Continue execution or check progress"
- `verifying` → "Complete verification with `ptah:verify`"
- `complete` → "All done! Start a new plan if needed."

</process>
```
  </action>
  <acceptance_criteria>
    - `skills/ptah-status/SKILL.md` exists and has YAML frontmatter with `name: ptah:status`
    - Description mentions "status" and "lifecycle"
    - Process reads config.json, STATE.json, and ECOSYSTEM.md
    - Next action suggestions mapped to each lifecycle state
  </acceptance_criteria>
  <verify>
    <automated>test -f skills/ptah-status/SKILL.md && grep -q "name: ptah:status" skills/ptah-status/SKILL.md && grep -q "lifecycle" skills/ptah-status/SKILL.md && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>ptah:status skill shows project state with lifecycle-aware next action suggestions.</done>
</task>

<task type="auto">
  <name>Task 4: Create project README</name>
  <files>README.md</files>
  <read_first>.planning/PROJECT.md, skills/ptah-help/SKILL.md</read_first>
  <action>
Create `README.md`:

```markdown
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
```
  </action>
  <acceptance_criteria>
    - `README.md` exists and contains `npx ptah`
    - `README.md` contains installation instructions
    - `README.md` contains quick start guide
    - `README.md` contains architecture diagram
    - `README.md` contains command reference tables
  </acceptance_criteria>
  <verify>
    <automated>test -f README.md && grep -q "npx ptah" README.md && grep -q "ptah init" README.md && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>README with installation, quickstart, architecture overview, and command reference.</done>
</task>

</tasks>

<verification>
1. All skill files have valid YAML frontmatter with `name` and `description`
2. README renders correctly in GitHub preview
3. Skill descriptions are specific enough for AI tool matching
</verification>

<success_criteria>
- ptah:help skill shows full command reference
- ptah:init skill guides through project creation
- ptah:status skill reads state and suggests next action
- README has install, quickstart, architecture, and command docs
- All skills use `ptah:<command>` naming in frontmatter
</success_criteria>

<output>
After completion, create `.planning/phases/01-workspace-foundation/01-04-SUMMARY.md`
</output>
