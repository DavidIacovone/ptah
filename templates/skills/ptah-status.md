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

Run the `ptah status` command which provides a formatted overview:

```bash
ptah status [--project <name>]
```

This displays lifecycle, plan progress, task counts, and wave position.

For additional detail, read the project's state files from `~/.ptah/projects/<name>/`:

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
