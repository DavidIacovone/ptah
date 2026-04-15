# Ptah

> Cross-repo AI orchestration — coordinate changes across multiple repositories
> with dependency-aware planning, wave-based execution, and automated verification.

Named after the Egyptian god of craftsmen — creation through thought and speech.

## Install

```bash
npm install -g ptah-cli
```

Or use directly:

```bash
npx ptah-cli init my-project
```

## Quick Start

1. **Create a project:** `ptah init my-project --cli-tool claude-code`
2. **Register repos:** Open your AI tool, run `ptah:register` for each repository
3. **Start orchestrating:** Describe a change → `ptah:plan` → `ptah:execute` → `ptah:verify`

## How It Works

Ptah extends your AI coding tool with multi-repo awareness:

```
Register repos → Discover contracts → Plan changes → Execute in waves → Verify
```

- **Ecosystem learning** — scans repos to understand structure, frameworks, and dependencies
- **Contract discovery** — auto-detects API contracts, shared types, and schema dependencies
- **DAG-based planning** — decomposes changes into atomic tasks ordered by cross-repo dependencies
- **Wave execution** — foundation repos first, consumers later — maximizes safe parallelism
- **Diff-based verification** — AI reviewers validate each task's output against acceptance criteria

## Example: Adding `createdBy` Across 3 Repos

```bash
# Set up your project
ptah init my-saas --cli-tool claude-code

# In your AI tool:
ptah:register ~/code/shared-types --role shared-lib
ptah:register ~/code/api-server --role backend
ptah:register ~/code/web-app --role frontend

ptah:discover  # Finds: shared-types → api-server, shared-types → web-app

ptah:plan "Add a createdBy field to all user-generated resources"
# Wave 1: shared-types (add CreatedBy to base types)
# Wave 2: api-server + web-app (consume updated types, in parallel)

ptah:execute   # Runs tasks in wave order, collects diffs
ptah:verify    # AI reviews each diff against task criteria
```

## Commands

### CLI (terminal)

| Command | Description |
|---------|-------------|
| `ptah init <name>` | Create a new project (auto-installs skills) |
| `ptah list` | List all projects |
| `ptah setup --tool <tool>` | Install skills into AI tool |
| `ptah check-permission <action>` | Check permission level for an action |
| `ptah status` | Show lifecycle and execution progress |
| `ptah help` | Show help |

### Skills (inside AI tool)

| Skill | Description |
|-------|-------------|
| `ptah:register` | Register a repository |
| `ptah:learn` | Scan ecosystem structure |
| `ptah:discover` | Discover cross-repo contracts |
| `ptah:plan` | Generate dependency-aware task plans |
| `ptah:execute` | Execute plans in wave order |
| `ptah:verify` | Verify changes against criteria |
| `ptah:status` | Show workspace state |
| `ptah:help` | Show command reference |

## Setup by Tool

### Claude Code

```bash
ptah init my-project --cli-tool claude-code
# Skills auto-installed to ~/.claude/skills/
```

### Gemini CLI

```bash
ptah init my-project --cli-tool gemini-cli
# Skills auto-installed to ~/.gemini/antigravity/skills/
```

Manual setup (if auto-install didn't run):

```bash
ptah setup --tool claude-code  # or gemini-cli
```

## Configuration

Projects use role-based permission tiers for safety control:

| Tier | Default | Actions |
|------|---------|---------|
| `read` | `auto` | status checks, config reads, plan viewing |
| `write` | `confirm` | file edits, git commits, branch creation |
| `destructive` | `confirm` | git push, branch deletion, state reset |

Set `mode: "auto-accept"` to auto-approve all actions, or configure per-tier overrides in `config.json`.

## License

MIT
