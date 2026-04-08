---
name: ptah:register
description: Register a repository with the current project. Use when the user wants to add, register, or connect a repository to their multi-repo orchestration project.
---

<objective>
Register a new repository with the current Ptah project.

This skill allows the user to add a repository to their ecosystem map by specifying its path and optionally its role (e.g., frontend, backend).
</objective>

<process>

## Step 1: Collect Repository Information

Ask the user for:
1. **Repository path** (required) — absolute or relative path to the repo directory
2. **Role** (optional) — `frontend`, `backend`, `shared-lib`, `infra`, etc. (if omitted, Ptah will try to auto-detect)
3. **Project name** (optional) — the Ptah project to register this repo in (defaults to the active project if only one exists)

## Step 2: Run Register Command

Execute the CLI command with collected parameters:

```bash
ptah register <path> [--role <role>] [--project <project>]
```

If `ptah` is not installed globally, use:
```bash
npx ptah register <path> [--role <role>] [--project <project>]
```

## Step 3: Confirm Success

After successful registration, report:
- Repository name and path
- Detected/assigned role
- Framework and language (if detected)
- Updated ECOSYSTEM.md location

## Step 4: If Error

If the command fails:
- Check if the path exists and is a directory
- Verify the repository isn't already registered
- Ensure a valid project name is provided if multiple projects exist

</process>
