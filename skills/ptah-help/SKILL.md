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
| `ptah setup` | Install skills into AI tool |
| `ptah status` | Show project lifecycle and execution progress |
| `ptah check-permission <action>` | Check permission level for an action |
| `ptah help` | Show this help message |

**Options for `ptah init`:**
- `--location <path>` — Custom location for .ptah/ home (default: `~/.ptah`)
- `--cli-tool <tool>` — AI tool: `gemini-cli` or `claude-code` (default: `gemini-cli`)
- `--max-tokens <n>` — Max tokens per session (default: 200000)
- `--mode <mode>` — `safe` or `auto-accept` (default: `safe`)

**Options for `ptah setup`:**
- `--tool <tool>` — Target AI tool: `gemini-cli` or `claude-code` (default: `gemini-cli`)

### Skill Commands (run inside AI tool)

| Skill | Description | Status |
|-------|-------------|--------|
| `ptah:help` | Show this reference | ✓ Available |
| `ptah:init` | Interactive project setup guide | ✓ Available |
| `ptah:status` | Show workspace status | ✓ Available |
| `ptah:register` | Register a repository | ✓ Available |
| `ptah:learn` | Scan ecosystem structure | ✓ Available |
| `ptah:discover` | Discover cross-repo contracts | ✓ Available |
| `ptah:plan` | Generate task plans | ✓ Available |
| `ptah:execute` | Execute task plans | ✓ Available |
| `ptah:verify` | Verify completed work | ✓ Available |

### Getting Started

1. Install: `npm install -g ptah` (or use `npx ptah`)
2. Create project: `ptah init my-project --cli-tool claude-code`
3. Skills are auto-installed during init
4. Open your AI tool and start using skill commands

</process>
