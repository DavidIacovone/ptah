---
name: ptah:plan
description: Generate a cross-repo task plan from a natural language change description. Use when the user wants to plan a multi-repository change, break work into tasks, or create an execution plan.
---

<objective>
Decompose a natural language change description into atomic, per-repo tasks. Assign each task to a specific repository based on the ecosystem context and contract registry. Save the plan for review before execution.
</objective>

<process>

## Step 1: Gather Context

Read the project's ecosystem to understand what repos are registered and how they connect:

```bash
ptah list
```

Then review the ecosystem state:

```bash
ptah discover <project-name>
```

## Step 2: Analyze the Change Request

Based on the user's description, determine:
- **Which repos** are affected (using repo profiles and contracts)
- **What changes** are needed in each repo
- **What dependencies** exist between the changes (e.g., shared types must update before consumers)

## Step 3: Create Task Breakdown

For each affected repo, create one or more atomic tasks. Each task should be:
- **Specific** — one clear change per task
- **Repo-scoped** — assigned to exactly one repository
- **Dependency-aware** — list any task IDs this task depends on

## Step 4: Run Plan Command

Pass the structured tasks to the CLI:

```bash
ptah plan <project-name> --description "Your change description" --tasks '[
  {"id": "t1", "repo": "shared-types", "description": "Add new UserProfile field", "wave": 1, "depends_on": []},
  {"id": "t2", "repo": "backend-api", "description": "Update user endpoint to include new field", "wave": 2, "depends_on": ["t1"]},
  {"id": "t3", "repo": "frontend-web", "description": "Display new field in profile page", "wave": 2, "depends_on": ["t1"]}
]'
```

If `ptah` is not installed globally, use:
```bash
npx ptah plan <project-name> --description "..." --tasks '[...]'
```

## Step 5: Review the Plan

After creation, present the plan to the user:

- Show all tasks grouped by wave
- Highlight cross-repo dependencies
- Confirm the task count and wave count

Ask the user to approve or modify the plan before execution.

## Step 6: Assign Waves (Optional)

If tasks don't have wave assignments, run the DAG builder to auto-assign waves:

```bash
ptah build-dag <project-name> --plan <plan-id>
```

This will analyze task dependencies and assign optimal wave numbers.

## Step 7: Confirm Success

- Verify the plan was created in `~/.ptah/projects/<project>/plans/`
- Verify `STATE.json` now shows `lifecycle: "planned"` and `current_plan` is set
- Report the plan ID, task count, and wave count to the user

## If Error

- Ensure repositories are registered (`ptah register`)
- Check that task repo names match registered repository names exactly
- Verify the tasks JSON is valid (proper quoting, array format)
- Run `ptah list` to confirm the project exists

</process>
