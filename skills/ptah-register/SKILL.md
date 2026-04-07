---
name: ptah:register
description: Register a repository with the current Ptah project. Use when the user wants to add a repo to their ecosystem, says "register repo", or "add repo".
---

<objective>
Register a repository with the active Ptah project. Creates a stub profile with auto-detected role, framework, and language. Full scanning is deferred to `ptah:learn`.

**Prerequisites:** A Ptah project must exist (`ptah init <name>` first).
</objective>

<process>

## Step 1: Determine target and project

The user may provide:
- A path to register (defaults to current directory if omitted)
- A role override via `--role <role>` (otherwise auto-detected)
- A project name via `--project <name>` (otherwise inferred if only one project exists)

## Step 2: Run the registration command

```bash
npx tsx $(npm root -g)/ptah-cli/src/commands/register.ts <path> [--role <role>] [--project <name>]
```

Or run via the CLI:
```bash
ptah register <path> [--role <role>] [--project <name>]
```

**If path is omitted**, the current working directory is used.

## Step 3: Verify registration

Check that:
1. A profile JSON file was created at `~/.ptah/projects/<project>/repos/<repo-name>.json`
2. The auto-detected role makes sense — if not, re-run with `--role <correct-role>`

## Step 4: Update ECOSYSTEM.md

After registration, update the project's ECOSYSTEM.md to include the new repository in the table:

```markdown
| <repo-name> | <role> | <path> | <framework> | <language> |
```

## Step 5: Report and suggest next steps

Tell the user:
- What was registered and with what role
- Suggest `ptah:learn` for deep analysis
- Suggest `ptah:register` again for additional repos

</process>
