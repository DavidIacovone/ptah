/**
 * @module schemas
 *
 * Zod schema definitions for all Ptah data structures.
 *
 * Every piece of data that Ptah reads from or writes to disk is validated
 * against the schemas defined here. This ensures runtime type safety and
 * provides canonical TypeScript types for the entire codebase.
 *
 * **Schema ordering matters** — schemas that are referenced by other schemas
 * must be defined first (e.g. `ContractSchema` before `ProjectStateSchema`).
 */

import { z } from 'zod';

// ── Permission Schemas ─────────────────────────────────────────

/**
 * Permission level for a category of actions.
 *
 * - `auto`    — action proceeds without user interaction
 * - `confirm` — user is prompted before the action executes
 * - `deny`    — action is blocked entirely
 */
export const PermissionLevelSchema = z.enum(['auto', 'confirm', 'deny']);

export type PermissionLevel = z.infer<typeof PermissionLevelSchema>;

/**
 * Role-based permission tiers controlling how Ptah handles different action categories.
 *
 * Defaults are conservative: reads are automatic, writes and destructive actions
 * require confirmation. Users opt into more automation as they build trust.
 */
export const PermissionsSchema = z.object({
  /** Status checks, config reads, plan viewing. */
  read: PermissionLevelSchema.default('auto'),
  /** File edits, git commits, branch creation. */
  write: PermissionLevelSchema.default('confirm'),
  /** Git push, branch deletion, state reset. */
  destructive: PermissionLevelSchema.default('confirm'),
});

export type Permissions = z.infer<typeof PermissionsSchema>;

/**
 * Maps individual actions to their permission tier.
 *
 * Used by `ptah check-permission <action>` to look up which category
 * an action belongs to, then check the configured permission level.
 */
export const PERMISSION_ACTION_MAP: Record<string, 'read' | 'write' | 'destructive'> = {
  'status_check': 'read',
  'config_read': 'read',
  'plan_view': 'read',
  'file_edit': 'write',
  'git_commit': 'write',
  'branch_create': 'write',
  'git_push': 'destructive',
  'branch_delete': 'destructive',
  'state_reset': 'destructive',
};

// ── Project Config Schema ──────────────────────────────────────

/**
 * Per-project configuration, stored at `~/.ptah/projects/<name>/config.json`.
 *
 * Controls which AI tool is used, token budget, and permission mode.
 * The top-level `mode` field acts as a shorthand: `auto-accept` sets all
 * permission tiers to `auto`, while `safe` defers to per-tier settings.
 */
export const ProjectConfigSchema = z.object({
  /** Which AI CLI tool drives this project. */
  cli_tool: z.enum(['gemini-cli', 'claude-code']).default('gemini-cli'),
  /** Maximum context-window tokens the AI tool should use. */
  max_tokens: z.number().positive().default(200000),
  /** Permission mode: `safe` requires confirmation, `auto-accept` runs unattended. */
  mode: z.enum(['auto-accept', 'safe']).default('safe'),
  /** Granular per-category permission overrides. Takes precedence when `mode` is `safe`. */
  permissions: PermissionsSchema.default({}),
  /** ISO-8601 timestamp of when the project was created. */
  created_at: z.string().default(''),
  /** Ptah version that created this project. */
  ptah_version: z.string().default(''),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

// ── Global Config Schema ───────────────────────────────────────

/**
 * Machine-wide Ptah configuration, stored at `~/.ptah/config.json`.
 *
 * Holds defaults and the resolved Ptah home directory.
 */
export const GlobalConfigSchema = z.object({
  /** Default AI CLI tool for new projects. */
  default_cli_tool: z.enum(['gemini-cli', 'claude-code']).default('gemini-cli'),
  /** Absolute path to the Ptah home directory (usually `~/.ptah`). */
  ptah_home: z.string().default(''),
  /** Absolute path to the installed `ptah` package (used to locate templates). */
  ptah_install_path: z.string().default(''),
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

// ── Task Progress Schema ───────────────────────────────────────

/**
 * Aggregate progress counters for the currently active plan.
 *
 * Embedded inside {@link ProjectStateSchema}.
 */
export const TaskProgressSchema = z.object({
  /** Total number of tasks in the current plan. */
  total: z.number().default(0),
  /** Number of tasks that finished successfully. */
  completed: z.number().default(0),
  /** Number of tasks that errored out. */
  failed: z.number().default(0),
  /** The wave currently being executed (0 = not started). */
  current_wave: z.number().default(0),
});

export type TaskProgress = z.infer<typeof TaskProgressSchema>;

// ── Contract Schema ────────────────────────────────────────────

/**
 * A dependency contract between two repositories.
 *
 * Contracts are discovered automatically by {@link discoverContracts} (explicit
 * npm dependencies, role-based heuristics, export matching) and can be manually
 * confirmed by the user.
 *
 * **Must be defined before `ProjectStateSchema`** which embeds an array of
 * contracts.
 */
export const ContractSchema = z.object({
  /** Name of the repository that provides the dependency (upstream). */
  provider: z.string(),
  /** Name of the repository that consumes the dependency (downstream). */
  consumer: z.string(),
  /** How the contract was detected (e.g. `"npm dependency"`, `"role match"`). */
  type: z.string(),
  /** Confidence score from 0 (guess) to 1 (certain). */
  confidence: z.number().min(0).max(1),
  /** Human-readable explanation of why this contract was inferred. */
  evidence: z.string(),
  /** Whether a human has verified this contract. Only confirmed contracts influence DAG ordering. */
  confirmed: z.boolean().default(false),
  /** ISO-8601 timestamp of when the contract was discovered. */
  discovered_at: z.string().default(''),
});

export type Contract = z.infer<typeof ContractSchema>;

// ── Project State Schema ───────────────────────────────────────

/**
 * The set of valid project lifecycle stages, forming a linear progression:
 *
 * ```
 * idle → learning → discovering → planning → planned → executing → verifying → complete
 * ```
 */
export const LifecycleSchema = z.enum([
  'idle',
  'learning',
  'discovering',
  'planning',
  'planned',
  'executing',
  'verifying',
  'complete',
]);

export type Lifecycle = z.infer<typeof LifecycleSchema>;

/**
 * Runtime state for a Ptah project, stored at `~/.ptah/projects/<name>/STATE.json`.
 *
 * Tracks the current lifecycle stage, discovered contracts, active plan, and
 * task progress. Updated automatically as commands execute.
 */
export const ProjectStateSchema = z.object({
  /** Current lifecycle stage of the project. */
  lifecycle: LifecycleSchema.default('idle'),
  /** Number of repositories registered in this project. */
  repos_registered: z.number().default(0),
  /** Number of cross-repo contracts discovered so far. */
  contracts_discovered: z.number().default(0),
  /** All discovered contracts between repos. */
  contracts: z.array(ContractSchema).default([]),
  /** ID of the currently active plan, or `null` if no plan is active. */
  current_plan: z.string().nullable().default(null),
  /** Aggregate task progress for the active plan. */
  tasks: TaskProgressSchema.default({}),
  /** ISO-8601 timestamp of the last CLI / skill interaction. */
  last_session: z.string().nullable().default(null),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;

// ── Repo Profile Schema ────────────────────────────────────────

/**
 * Detailed profile for a single registered repository.
 *
 * Created by `ptah register`, enriched by `ptah learn`. Stored at
 * `~/.ptah/projects/<name>/repos/<repo-name>.json`.
 */
export const RepoProfileSchema = z.object({
  /** Short name of the repository (usually the directory basename). */
  name: z.string(),
  /** Absolute filesystem path to the repository root. */
  path: z.string(),
  /** Architectural role (e.g. `"frontend"`, `"backend"`, `"shared-lib"`). */
  role: z.string(),
  /** Detected framework (e.g. `"Next.js"`, `"Express"`), or `null` if unknown. */
  framework: z.string().nullable().default(null),
  /** Detected primary language (e.g. `"TypeScript"`, `"Go"`), or `null` if unknown. */
  language: z.string().nullable().default(null),
  /** Notable top-level directories found in the repo (e.g. `["src", "tests"]`). */
  key_directories: z.array(z.string()).default([]),
  /** Summary of the repo's public exports (entry points, package exports). */
  exports_summary: z.string().default(''),
  /** Names of other registered repos that this repo depends on. */
  dependencies: z.array(z.string()).default([]),
  /** Additional technology fingerprint metadata. */
  tech_fingerprint: z.object({
    /** API style (e.g. `"REST"`, `"GraphQL"`). */
    api_style: z.string().nullable().default(null),
    /** ORM or database layer (e.g. `"Prisma"`, `"TypeORM"`). */
    orm: z.string().nullable().default(null),
    /** Test framework (e.g. `"vitest"`, `"jest"`). */
    test_framework: z.string().nullable().default(null),
    /** CI/CD system (e.g. `"github-actions"`, `"circleci"`). */
    ci: z.string().nullable().default(null),
  }).default({}),
  /** ISO-8601 timestamp of when the repo was registered. */
  registered_at: z.string().default(''),
  /** ISO-8601 timestamp of the last `ptah learn` scan, or `null` if never scanned. */
  learned_at: z.string().nullable().default(null),
});

export type RepoProfile = z.infer<typeof RepoProfileSchema>;

// ── Task & Plan Schemas ──────────────────────────────────────────

/** Possible states for an individual task within a plan. */
export const TaskStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/**
 * A single atomic unit of work within a plan.
 *
 * Each task targets exactly one repository and may depend on other tasks
 * (via `depends_on`). The DAG builder assigns wave numbers to determine
 * parallel execution order.
 */
export const TaskSchema = z.object({
  /** Unique identifier for this task (e.g. `"t1"`, `"add-user-field"`). */
  id: z.string(),
  /** Name of the registered repository this task targets. */
  repo: z.string(),
  /** Human-readable description of the change to make. */
  description: z.string(),
  /** Current execution status. */
  status: TaskStatusSchema.default('pending'),
  /** Wave number (1-based). Tasks in the same wave may run in parallel. */
  wave: z.number().default(1),
  /** IDs of tasks that must complete before this task can start. */
  depends_on: z.array(z.string()).default([]),
  /** Git diff produced by executing this task, or `null` if not yet executed. */
  diff: z.string().nullable().default(null),
  /** Error message if the task failed, or `null` on success. */
  error: z.string().nullable().default(null),
});

export type Task = z.infer<typeof TaskSchema>;

/**
 * A cross-repo execution plan composed of ordered tasks.
 *
 * Plans are created by `ptah plan` and stored at
 * `~/.ptah/projects/<name>/plans/<plan-id>.json`.
 */
export const PlanSchema = z.object({
  /** Unique plan identifier (e.g. `"plan-1712345678"`). */
  id: z.string(),
  /** Human-readable summary of what this plan accomplishes. */
  description: z.string(),
  /** ISO-8601 timestamp of when the plan was created. */
  created_at: z.string(),
  /** Current plan status. */
  status: z.enum(['draft', 'approved', 'executing', 'completed', 'failed']).default('draft'),
  /** Ordered list of tasks in this plan. */
  tasks: z.array(TaskSchema).default([]),
  /** Total number of execution waves (set by `ptah build-dag`). */
  waves: z.number().default(0),
});

export type Plan = z.infer<typeof PlanSchema>;
