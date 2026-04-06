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
