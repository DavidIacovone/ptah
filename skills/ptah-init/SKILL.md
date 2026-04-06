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
