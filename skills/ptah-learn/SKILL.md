---
name: ptah:learn
description: Perform deep scanning of all registered repositories to discover tech stack, structure, and exports. Use when the user wants to update the ecosystem map, scan for frameworks, or refresh repository profiles.
---

<objective>
Scan all registered repositories in the current Ptah project to discover their deep structure and metadata.

This skill allows Ptah to automatically detect:
- Frameworks (React, NestJS, Next.js, Express, Go, Python, Rust, etc.)
- Primary languages
- Key directories (src, lib, api, docs, tests, etc.)
- Public API exports and entry points
</objective>

<process>

## Step 1: Identify Active Project

The skill will target the active Ptah project. If multiple projects exist and none are specified, it will ask for clarification.

## Step 2: Run Learn Command

Execute the CLI command to perform the bulk scan:

```bash
ptah learn [--project <project>]
```

If `ptah` is not installed globally, use:
```bash
npx ptah learn [--project <project>]
```

## Step 3: Review Results

After the scan completes, report:
- Number of repositories scanned
- New frameworks or languages detected
- Summary of updated profiles (stored in `repos/` subdirectory)

## Step 4: If Error

If the command fails:
- Check if any repositories are registered (`ptah list` or `ptah:status`)
- Verify read permissions for the repository directories
- Ensure the project state is valid

</process>
