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

// ── Contract Schema ────────────────────────────────────────────

export const ContractConfidence = z.enum(['high', 'medium', 'low']);
export type ContractConfidence = z.infer<typeof ContractConfidence>;

export const ContractType = z.enum(['api', 'shared-type', 'implicit']);
export type ContractType = z.infer<typeof ContractType>;

export const ContractSchema = z.object({
  provider: z.string(),
  consumer: z.string(),
  type: ContractType,
  confidence: ContractConfidence,
  evidence: z.string(),
  confirmed: z.boolean().default(false),
  discovered_at: z.string().default(''),
});

export type Contract = z.infer<typeof ContractSchema>;
