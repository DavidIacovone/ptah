---
name: ptah:execute
description: Execute an approved Ptah cross-repo plan using native AI subagents. Iterates through wave-ordered tasks, dispatching subagents to each repository with explicit working directories.
---

<objective>
Execute the approved cross-repo plan by iterating through tasks in wave order.
For each task, spawn a subagent targeted at the correct repository,
then record the outcome via Ptah's CLI helpers.

This skill is the core orchestration loop — it bridges Ptah's planning
output with the AI tool's native task execution capabilities.
</objective>

<process>

## Step 1: Verify Preconditions

Run `ptah status` to confirm:
- Lifecycle is `planned` or `executing`
- An active plan exists with pending tasks

If not ready, tell the user what's needed first.

## Step 1.5: Check Permissions

Before executing, verify write permissions:

```bash
ptah check-permission file_edit
```

Parse the JSON output:
- If `"level": "deny"` — stop and inform the user that file edits are blocked by permission config.
- If `"level": "confirm"` — ask the user for confirmation before proceeding.
- If `"level": "auto"` — continue silently.

## Step 2: Execution Loop

Repeat the following cycle until the plan is done or blocked:

### 2a. Fetch Next Task

```bash
ptah next-task
```

Parse the JSON response. Handle each status:

- **`"task"`** → proceed to step 2b
- **`"waiting_on_parallel"`** → wait briefly and retry
- **`"wave_complete"`** → run `ptah next-task` again to advance to the next wave
- **`"plan_complete"`** → proceed to Step 3
- **`"blocked"`** → report blocked tasks to user and stop
- **`"error"`** → report error and stop

### 2b. Execute Task via Subagent

The task JSON includes:
- `task.id` — unique task identifier
- `task.repo` — repository name
- `task.repo_path` — **absolute filesystem path** to the repository
- `task.description` — what changes to make
- `task.wave` — current wave number
- `task.depends_on` — prerequisite task IDs

**Spawn a subagent** to work in `{task.repo_path}` with the following instructions:

> Execute the following task in the repository at {task.repo_path}:
>
> {task.description}
>
> IMPORTANT:
> - Work ONLY within the repository at: {task.repo_path}
> - Do NOT modify files outside this repository
> - Commit your changes with a descriptive message
> - Report what you changed when done

The subagent MUST operate in `{task.repo_path}` as its working directory.

> **CRITICAL**: Always direct the subagent to `task.repo_path` as its
> working directory. This ensures cross-repo isolation — each subagent
> operates exclusively within its target repository.

### 2c. Record Outcome

Before recording the outcome, check commit permission:

```bash
ptah check-permission git_commit
```

Handle `deny`/`confirm`/`auto` as in Step 1.5.

**If the subagent succeeds:**
```bash
ptah complete-task {task.id}
```
This captures the git diff and updates progress.

**If the subagent fails or crashes:**
```bash
ptah fail-task {task.id} "Brief description of the failure"
```
This records the error. Downstream dependent tasks will be blocked.

### 2d. Continue Loop

Return to step 2a to fetch the next task.

## Step 3: Execution Complete

When `ptah next-task` returns `plan_complete`:

1. Report summary to the user:
   - Total tasks completed
   - Any failed tasks
   - Wave execution order

2. Suggest verification:
   ```
   Plan execution complete! Run ptah:verify to validate the changes
   against acceptance criteria.
   ```

## Error Recovery

If execution is interrupted:
- Re-running `ptah:execute` picks up where it left off
- Completed tasks are skipped
- Failed tasks can be retried after `ptah reset-state`

</process>
