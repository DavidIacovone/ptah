---
name: ptah:discover
description: Discover cross-repository contracts and dependencies between registered repositories. Use when the user wants to see how their repos interact or identify API contracts.
---

<objective>
Analyze all registered repositories in the current project to identify explicit (package.json) and implicit (role-based) dependencies.
</objective>

<process>

## Step 1: Run Discover Command

Execute the CLI command for the current project:

```bash
ptah discover [project-name]
```

If `ptah` is not installed globally, use:
```bash
npx ptah discover [project-name]
```

## Step 2: Review Discovered Contracts

Ptah will display a list of:
- **Provider** — repository providing an API or library
- **Consumer** — repository using the API or library
- **Type** — how the contract was detected (e.g., `npm dependency`, `role match`)
- **Confidence** — probability of the contract being correct (0.0 to 1.0)

## Step 3: Generate/Update CONTRACTS.md

Run the following to update the human-readable contract map:

```bash
ptah discover [project-name] --generate
```

## Step 4: Confirm Success

- Report how many new contracts were discovered.
- Verify that `STATE.json` was updated with the new contract list.
- Check that `CONTRACTS.md` is updated in the project directory.

## Step 5: If Error

- Ensure repositories are already registered (`ptah register`).
- Run `ptah learn` first to ensure all repo structure is understood.
- Verify project exists (`ptah list`).

</process>
