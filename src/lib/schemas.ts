import { z } from 'zod';

// ── Project Config Schema ──────────────────────────────────────

export const ProjectConfigSchema = z.object({
  cli_tool: z.enum(['gemini-cli', 'claude-code']).default('gemini-cli'),
  max_tokens: z.number().positive().default(200000),
  mode: z.enum(['auto-accept', 'safe']).default('safe'),
  created_at: z.string().default(''),
  ptah_version: z.string().default(''),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

// ── Global Config Schema ───────────────────────────────────────

export const GlobalConfigSchema = z.object({
  default_cli_tool: z.enum(['gemini-cli', 'claude-code']).default('gemini-cli'),
  ptah_home: z.string().default(''),
  ptah_install_path: z.string().default(''),
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

// ── Task Progress Schema ───────────────────────────────────────

export const TaskProgressSchema = z.object({
  total: z.number().default(0),
  completed: z.number().default(0),
  failed: z.number().default(0),
  current_wave: z.number().default(0),
});

export type TaskProgress = z.infer<typeof TaskProgressSchema>;

// ── Contract Schema ────────────────────────────────────────────
// (Defined before ProjectStateSchema which references it)

export const ContractSchema = z.object({
  provider: z.string(),
  consumer: z.string(),
  type: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  confirmed: z.boolean().default(false),
  discovered_at: z.string().default(''),
});

export type Contract = z.infer<typeof ContractSchema>;

// ── Project State Schema ───────────────────────────────────────

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

export const ProjectStateSchema = z.object({
  lifecycle: LifecycleSchema.default('idle'),
  repos_registered: z.number().default(0),
  contracts_discovered: z.number().default(0),
  contracts: z.array(ContractSchema).default([]),
  current_plan: z.string().nullable().default(null),
  tasks: TaskProgressSchema.default({}),
  last_session: z.string().nullable().default(null),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;

// ── Repo Profile Schema ────────────────────────────────────────

export const RepoProfileSchema = z.object({
  name: z.string(),
  path: z.string(),
  role: z.string(),
  framework: z.string().nullable().default(null),
  language: z.string().nullable().default(null),
  key_directories: z.array(z.string()).default([]),
  exports_summary: z.string().default(''),
  dependencies: z.array(z.string()).default([]),
  tech_fingerprint: z.object({
    api_style: z.string().nullable().default(null),
    orm: z.string().nullable().default(null),
    test_framework: z.string().nullable().default(null),
    ci: z.string().nullable().default(null),
  }).default({}),
  registered_at: z.string().default(''),
  learned_at: z.string().nullable().default(null),
});

export type RepoProfile = z.infer<typeof RepoProfileSchema>;

// ── Task & Plan Schemas ──────────────────────────────────────────

export const TaskStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  repo: z.string(),
  description: z.string(),
  status: TaskStatusSchema.default('pending'),
  wave: z.number().default(1),
  depends_on: z.array(z.string()).default([]),
  diff: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
});

export type Task = z.infer<typeof TaskSchema>;

export const PlanSchema = z.object({
  id: z.string(),
  description: z.string(),
  created_at: z.string(),
  status: z.enum(['draft', 'approved', 'executing', 'completed', 'failed']).default('draft'),
  tasks: z.array(TaskSchema).default([]),
  waves: z.number().default(0),
});

export type Plan = z.infer<typeof PlanSchema>;
