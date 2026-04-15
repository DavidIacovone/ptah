---
name: ptah:verify
description: Verify executed tasks against original acceptance criteria using specialized AI reviewer agents. Spawns a reviewer for each completed task's diff.
---

<objective>
After plan execution, verify that every completed task actually fulfills
its intended purpose by reviewing the generated diffs against the original
task descriptions and acceptance criteria.

This skill dispatches specialized reviewer subagents — one per task — to
provide independent code review of the changes.
</objective>

<process>

## Step 1: Get Verification Manifest

```bash
ptah verify-manifest
```

This outputs a JSON manifest with:
- `plan_id`, `plan_description`
- `missing_diffs` — boolean warning flag
- `tasks[]` — each with `id`, `repo`, `description`, `status`, `diff_path`, `diff_exists`, `diff_has_contents`

If `missing_diffs` is true, warn the user that some tasks don't have recorded diffs.

## Step 2: Review Each Task

For each task where `status` is `"completed"` and `diff_has_contents` is `true`:

### 2a. Read the Diff

```bash
cat {task.diff_path}
```

### 2b. Spawn Reviewer Subagent

**Spawn a subagent** to review this task's changes:

> You are a code reviewer. Analyze the following diff and determine
> if it correctly implements the described task.
>
> ## Task Description
> {task.description}
>
> ## Repository
> {task.repo}
>
> ## Diff
> {diff_contents}
>
> ## Review Criteria
> 1. Does the diff implement what the task description asks for?
> 2. Are there any obvious bugs, missing edge cases, or incomplete implementations?
> 3. Does the code follow reasonable quality standards?
>
> ## Output Format
> Respond with:
> - **PASS** or **FAIL**
> - Brief explanation (2-3 sentences)
> - If FAIL: what specifically is missing or wrong

### 2c. Record Review Result

Collect the PASS/FAIL result from each reviewer.

## Step 3: Summarize Results

Present a table of results:

```
## Verification Results

| Task | Repo | Result | Notes |
|------|------|--------|-------|
| t1   | api  | ✅ PASS | Implements endpoint correctly |
| t2   | web  | ❌ FAIL | Missing error handling |

Passed: X/Y tasks
Failed: Z tasks
```

## Step 4: Decide Next Step

**If all tasks PASS:**
```
All tasks verified! Run the following to complete the lifecycle:

ptah mark-verified
```

**If any tasks FAIL:**
```
Some tasks need attention. Options:
1. Fix the issues and re-run ptah:execute
2. Accept the results anyway with: ptah mark-verified
3. Reset and re-plan with: ptah reset-state
```

## Step 5: Handle Edge Cases

- **Tasks with `status: "failed"`**: Skip review, note in summary
- **Tasks with empty diffs**: Flag as suspicious but don't auto-fail
- **Tasks with missing diff files**: Report as unverifiable

</process>
