# Architecture Research

**Domain:** Skill-based meta-orchestration / multi-repo AI coding coordination
**Researched:** 2026-04-03 | **Updated:** 2026-04-06 (pivot to extension model)
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│              AI Tool (Gemini CLI / Claude Code)              │
│                                                              │
│  Discovers and executes Ptah skill files:                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ptah:init │ │ptah:plan │ │ptah:exec │ │ptah:stat │  ...  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │             │            │             │             │
│  ┌────┴─────────────┴────────────┴─────────────┴─────┐      │
│  │              Skill Instructions                    │      │
│  │  (AI reads + follows orchestration logic)          │      │
│  └────┬──────────────────────────────────────────────┘      │
│       │                                                      │
│  ┌────┴──────────────────────────────────────────────┐      │
│  │              Helper Scripts (TypeScript)            │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │      │
│  │  │ Ecosystem│ │ Contract │ │   DAG    │           │      │
│  │  │ Scanner  │ │ Detector │ │ Builder  │           │      │
│  │  └──────────┘ └──────────┘ └──────────┘           │      │
│  └───────────────────────────────────────────────────┘      │
│       │                                                      │
│  ┌────┴──────────────────────────────────────────────┐      │
│  │              .ptah/ Workspace State                │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │      │
│  │  │config.json│ │ECOSYSTEM │ │CONTRACTS │           │      │
│  │  │          │ │  .md     │ │  .md     │           │      │
│  │  └──────────┘ └──────────┘ └──────────┘           │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │      │
│  │  │ PLAN.md  │ │STATE.json│ │ repos/   │           │      │
│  │  │          │ │          │ │ (profiles)│           │      │
│  │  └──────────┘ └──────────┘ └──────────┘           │      │
│  └───────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
    ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
    │ Repo A  │         │ Repo B  │         │ Repo C  │
    │frontend │         │backend  │         │shared   │
    └─────────┘         └─────────┘         └─────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Skill Files | User-facing commands — entry points for Ptah operations | Markdown files with structured instructions that the AI tool reads and follows |
| Skill Instructions | Orchestration logic — guide the AI through multi-step workflows | Embedded in skill files as step-by-step instructions with decision points |
| Helper Scripts | Computationally intensive operations the AI shouldn't do manually | TypeScript scripts: repo scanning, contract detection, DAG generation |
| `.ptah/` State | Persistent workspace state across sessions | JSON + Markdown files: config, ecosystem map, contracts, plans, progress |
| Registered Repos | Target repositories that Ptah coordinates | Git repositories on local filesystem, each with a profile in `.ptah/repos/` |

## Recommended Project Structure

```
ptah/
├── bin/                            # CLI entrypoint
│   └── ptah.ts                     # Thin CLI: init, list, help
├── skills/                     # Skill definitions (tool-agnostic core)
│   ├── ptah:init/              # Workspace initialization
│   │   └── SKILL.md
│   ├── ptah:register/          # Repo registration
│   │   └── SKILL.md
│   ├── ptah:learn/             # Ecosystem learning
│   │   └── SKILL.md
│   ├── ptah:discover/          # Contract auto-discovery
│   │   └── SKILL.md
│   ├── ptah:plan/              # Task plan generation
│   │   └── SKILL.md
│   ├── ptah:execute/           # Wave execution
│   │   └── SKILL.md
│   ├── ptah:verify/            # Verification
│   │   └── SKILL.md
│   ├── ptah:status/            # Status check
│   │   └── SKILL.md
│   └── ptah:help/              # List available commands
│       └── SKILL.md
├── scripts/                    # Helper scripts (TypeScript)
│   ├── scan-repo.ts            # Scan repo structure, discover frameworks
│   ├── detect-contracts.ts     # Find cross-repo APIs, schemas, types
│   ├── build-dag.ts            # Generate dependency-aware task DAG
│   ├── collect-diffs.ts        # Parse git diffs post-execution
│   ├── validate-state.ts       # Verify project state consistency
│   └── utils/
│       ├── git.ts              # Git operations wrapper
│       ├── scanner.ts          # File system scanning
│       └── schemas.ts          # Zod schemas for state files
├── templates/                  # State file templates
│   ├── config.json             # Default project config
│   ├── ECOSYSTEM.md            # Ecosystem map template
│   ├── CONTRACTS.md            # Contract registry template
│   ├── PLAN.md                 # Task plan template
│   └── repo-profile.md        # Per-repo profile template
├── integrations/               # Tool-specific adaptations
│   ├── gemini-cli/             # Gemini CLI specific setup
│   │   └── README.md           # Installation instructions
│   └── claude-code/            # Claude Code specific setup
│       └── README.md           # Installation instructions
├── package.json                # npm package with bin entry for `ptah` CLI
├── tsconfig.json               # TypeScript config for CLI + scripts
└── README.md                   # Project documentation
```

### Structure Rationale

- **bin/:** Thin CLI entrypoint — handles `ptah init`, `ptah list`, `ptah help`. Published as npm package with `bin` field so `npx ptah` works
- **skills/:** One directory per command. Each contains a SKILL.md that the AI tool discovers. Tool-agnostic — the same skill file works in both Gemini CLI and Claude Code
- **scripts/:** TypeScript helpers for operations that are computational (scanning file systems, parsing ASTs, building DAGs). The AI tool invokes these via shell commands when the skill instructions tell it to
- **templates/:** Default templates for state files. Copied during `ptah init` into each new project
- **integrations/:** Tool-specific setup instructions. Minimal — mostly just "how to make your tool discover the skills"

### `.ptah/` Global Home Directory (created by `ptah init`)

```
~/.ptah/                            # Global Ptah home (user-configurable location)
├── config.json                     # Global settings (default CLI tool, location prefs)
└── projects/
    ├── my-ecommerce/               # Project 1
    │   ├── config.json             # Project config (CLI tool, max tokens, auto-accept/safe)
    │   ├── ECOSYSTEM.md            # Map of registered repos and relationships
    │   ├── CONTRACTS.md            # Auto-discovered cross-repo contracts
    │   ├── STATE.json              # Current lifecycle state + progress
    │   ├── repos/                  # Per-repo profiles
    │   │   ├── frontend-web.md     # Structure, framework, patterns
    │   │   ├── backend-api.md      # Structure, framework, patterns
    │   │   └── shared-types.md     # Structure, framework, patterns
    │   ├── plans/                  # Generated task plans
    │   │   ├── current/            # Active plan
    │   │   │   ├── PLAN.md         # Task DAG with wave assignments
    │   │   │   └── tasks/          # Individual task files
    │   │   └── archive/            # Completed plans
    │   └── logs/                   # Execution logs
    └── my-saas-platform/           # Project 2
        ├── config.json
        ├── ECOSYSTEM.md
        └── ...
```

## Architectural Patterns

### Pattern 1: Skill-Based Command Dispatch

**What:** Each Ptah command is a skill file that the AI tool discovers and executes. The AI reads the skill's instructions and follows them step-by-step, invoking helper scripts when computational work is needed.
**When to use:** For all user-facing commands.
**Trade-offs:** Less programmatic control than code-driven CLI, but zero infrastructure overhead.

**Example (SKILL.md for ptah:plan):**
```markdown
---
name: ptah:plan
description: Generate a dependency-aware task plan for cross-repo changes
---

## Steps

1. Read `.ptah/ECOSYSTEM.md` to understand registered repos
2. Read `.ptah/CONTRACTS.md` to understand cross-repo dependencies
3. Ask user to describe the change they want to make
4. Identify which repos are affected
5. Break the change into atomic tasks, one per repo
6. Run `tsx scripts/build-dag.ts` to generate dependency ordering
7. Write plan to `.ptah/plans/current/PLAN.md`
8. Present plan to user for approval
```

### Pattern 2: State-Driven Workflow

**What:** All workflow state lives in `.ptah/` files. The AI tool reads state to determine what's possible, updates state after actions. No in-memory state machine — the file system IS the state.
**When to use:** For lifecycle management (discuss→plan→execute→verify).
**Trade-offs:** State is inspectable and recoverable (just files), but requires consistent read-before-write discipline in skill instructions.

**Example (STATE.json):**
```json
{
  "lifecycle": "planning",
  "current_plan": "plans/current/PLAN.md",
  "repos_registered": 3,
  "contracts_discovered": 12,
  "tasks": {
    "total": 5,
    "completed": 0,
    "failed": 0,
    "current_wave": 0
  }
}
```

### Pattern 3: Helper Script Delegation

**What:** When the AI tool needs to do computational work (scan repos, parse ASTs, build DAGs), skill instructions tell it to run a TypeScript helper script. The script does the heavy lifting, writes results to `.ptah/` files, and the AI continues from the skill instructions.
**When to use:** For file system scanning, contract detection, DAG construction, diff parsing — anything where the AI doing it manually would be slow, error-prone, or token-wasteful.
**Trade-offs:** Requires Node.js + dependencies installed. But targets developers who already have these.

### Pattern 4: DAG-Based Task Ordering

**What:** Tasks are modeled as a Directed Acyclic Graph. The `build-dag.ts` helper script generates the DAG from task dependencies. Skill instructions guide the AI through wave-by-wave execution.
**When to use:** For plan execution — tasks across repos have natural dependency ordering.
**Trade-offs:** AI must faithfully follow wave ordering from the plan. Less deterministic than code-driven execution, but mitigated by clear plan structure.

## Data Flow

### Workspace Initialization Flow
```
[User: "ptah init my-ecommerce"]
    ↓
[CLI creates ~/.ptah/projects/my-ecommerce/]
    ↓
[CLI copies templates to project directory]
    ↓
[CLI initializes config.json with defaults (CLI tool, max tokens, safe mode)]
    ↓
[CLI reports: "Project created. Register repos with ptah:register."]
```

### Plan Execution Flow
```
[User: "ptah:execute" (inside AI tool)]
    ↓
[AI reads ptah:execute SKILL.md]
    ↓
[AI reads project STATE.json — confirms lifecycle == "planned"]
    ↓
[AI reads .ptah/plans/current/PLAN.md — gets task DAG]
    ↓
[Wave 1: AI executes tasks with no dependencies]
    ↓ (for each task in wave)
[AI reads task file → navigates to target repo → makes changes]
    ↓
[AI runs `tsx scripts/collect-diffs.ts` → records results]
    ↓
[AI updates STATE.json → marks wave complete]
    ↓
[Wave 2: AI executes tasks depending on Wave 1]
    ↓ (repeat until DAG complete)
[AI updates lifecycle → "executed"]
```

### Ecosystem Learning Flow
```
[User: "ptah:register ./backend-api --role backend"]
    ↓
[AI reads ptah:register SKILL.md]
    ↓
[AI runs `tsx scripts/scan-repo.ts ./backend-api`]
    ↓
[Script discovers: framework, language, structure, exports]
    ↓
[Script writes profile to .ptah/repos/backend-api.md]
    ↓
[AI updates .ptah/ECOSYSTEM.md with new repo]
    ↓
[AI reports findings to user for confirmation]
```

## Integration Points

### AI Tool Integration

| AI Tool | Skill Discovery | Script Execution | Notes |
|---------|----------------|------------------|-------|
| Claude Code | Reads SKILL.md from workspace dirs | `run_command` / bash | Well-documented, GSD reference exists |
| Gemini CLI | TBD — research extension format | Shell command execution | Need to verify skill discovery mechanism |

### Cross-Repo Integration

| Integration | How | Notes |
|-------------|-----|-------|
| Read files in other repos | AI navigates to repo path, reads files | Skills include repo paths from `.ptah/repos/` |
| Git operations across repos | Helper scripts use simple-git per repo | Each repo gets its own git instance |
| Contract validation | `detect-contracts.ts` scans across all registered repos | Cross-references exports and imports |

## Anti-Patterns

### Anti-Pattern 1: Overloading Skill Files

**What people do:** Put complex logic (loops, conditionals, calculations) in skill file Markdown
**Why it's wrong:** AI tools are approximate instruction followers, not deterministic code executors
**Do this instead:** Put complex logic in TypeScript helper scripts. Skills orchestrate; scripts compute

### Anti-Pattern 2: Skipping State Validation

**What people do:** Skill instructions assume state is correct without reading it first
**Why it's wrong:** User may have manually edited state, or previous step may have failed
**Do this instead:** Every skill reads `STATE.json` first and validates prerequisites

### Anti-Pattern 3: Keeping All State in Conversation

**What people do:** Rely on AI tool's conversation history for workflow state
**Why it's wrong:** Context window limits, session restarts lose everything
**Do this instead:** All durable state in `.ptah/` files. Conversation is ephemeral; files are permanent

## Sources

- GSD framework source — reference architecture for skill-based delivery, state management
- Claude Code SKILL.md format — skill discovery and execution patterns
- DAG scheduling patterns — topological sort, wave extraction
- Node.js filesystem APIs — file scanning, path resolution

---
*Architecture research for: Skill-based meta-orchestration with npm package CLI*
*Updated: 2026-04-06 (npx install, multi-project model)*
