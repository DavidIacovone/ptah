---
phase: 01-workspace-foundation
plan: 03
type: execute
wave: 2
depends_on: [01]
files_modified:
  - src/lib/schemas.ts
  - src/lib/state.ts
autonomous: true
requirements: [INIT-05, INIT-06]

must_haves:
  truths:
    - 'Zod schemas validate config.json against expected shape'
    - 'Zod schemas validate STATE.json against expected shape'
    - 'Invalid config values are rejected with clear error messages'
    - 'State read/write operations use schema validation'
  artifacts:
    - path: 'src/lib/schemas.ts'
      provides: 'Zod schemas for config and state validation'
      contains: 'z.object'
    - path: 'src/lib/state.ts'
      provides: 'Type-safe state read/write operations'
      contains: 'readState'
---

<objective>
Implement zod schema validation for config and state files with type-safe read/write operations.

Purpose: Ensure all state files (config.json, STATE.json) are validated at read time using zod schemas, preventing state corruption and providing clear error messages. Create reusable read/write utilities that downstream skills and scripts can depend on.

Output: 2 files — schemas module and state management module.
</objective>

<execution_context>
@~/.gemini/antigravity/get-shit-done/workflows/execute-plan.md
@~/.gemini/antigravity/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-workspace-foundation/01-CONTEXT.md
@.planning/phases/01-workspace-foundation/01-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create zod schemas for config and state</name>
  <files>src/lib/schemas.ts</files>
  <read_first>templates/config.json, templates/STATE.json, .planning/phases/01-workspace-foundation/01-RESEARCH.md</read_first>
  <action>
Create `src/lib/schemas.ts` — centralized zod schemas:

```typescript
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

// ── Repo Profile Schema (for future phases) ────────────────────
export const RepoProfileSchema = z.object({
  name: z.string(),
  path: z.string(),
  role: z.string(),
  framework: z.string().nullable().default(null),
  language: z.string().nullable().default(null),
  key_directories: z.array(z.string()).default([]),
  registered_at: z.string().default(''),
});

export type RepoProfile = z.infer<typeof RepoProfileSchema>;
```
  </action>
  <acceptance_criteria>
    - `src/lib/schemas.ts` exists and imports from `zod`
    - `src/lib/schemas.ts` exports `ProjectConfigSchema` with `cli_tool`, `max_tokens`, `mode`
    - `src/lib/schemas.ts` exports `ProjectStateSchema` with `lifecycle` and `tasks`
    - `src/lib/schemas.ts` exports `GlobalConfigSchema` with `ptah_home`
    - `src/lib/schemas.ts` exports type aliases: `ProjectConfig`, `ProjectState`, `GlobalConfig`
    - `LifecycleSchema` has all 8 lifecycle states: idle, learning, discovering, planning, planned, executing, verifying, complete
  </acceptance_criteria>
  <verify>
    <automated>test -f src/lib/schemas.ts && grep -q "z.object" src/lib/schemas.ts && grep -q "ProjectConfigSchema" src/lib/schemas.ts && grep -q "ProjectStateSchema" src/lib/schemas.ts && grep -q "LifecycleSchema" src/lib/schemas.ts && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>Zod schemas for project config, global config, project state, task progress, and repo profile.</done>
</task>

<task type="auto">
  <name>Task 2: Create type-safe state management utilities</name>
  <files>src/lib/state.ts</files>
  <read_first>src/lib/schemas.ts, src/lib/paths.ts</read_first>
  <action>
Create `src/lib/state.ts` — validated read/write for config and state:

```typescript
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ZodError } from 'zod';
import {
  ProjectConfigSchema,
  ProjectStateSchema,
  GlobalConfigSchema,
  type ProjectConfig,
  type ProjectState,
  type GlobalConfig,
} from './schemas.js';
import { getProjectDir, getGlobalConfigPath, getPtahHome } from './paths.js';

// ── Error formatting ───────────────────────────────────────────

function formatZodError(error: ZodError, filePath: string): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `  - ${path || 'root'}: ${issue.message}`;
  });
  return `Validation error in ${filePath}:\n${issues.join('\n')}`;
}

// ── Project Config ─────────────────────────────────────────────

export function readProjectConfig(projectName: string, ptahHome?: string): ProjectConfig {
  const projectDir = getProjectDir(projectName, ptahHome);
  const filePath = join(projectDir, 'config.json');

  if (!existsSync(filePath)) {
    throw new Error(`Project config not found: ${filePath}`);
  }

  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = ProjectConfigSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(formatZodError(result.error, filePath));
  }

  return result.data;
}

export function writeProjectConfig(projectName: string, config: ProjectConfig, ptahHome?: string): void {
  const projectDir = getProjectDir(projectName, ptahHome);
  const filePath = join(projectDir, 'config.json');

  const result = ProjectConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(formatZodError(result.error, filePath));
  }

  writeFileSync(filePath, JSON.stringify(result.data, null, 2));
}

// ── Project State ──────────────────────────────────────────────

export function readProjectState(projectName: string, ptahHome?: string): ProjectState {
  const projectDir = getProjectDir(projectName, ptahHome);
  const filePath = join(projectDir, 'STATE.json');

  if (!existsSync(filePath)) {
    throw new Error(`Project state not found: ${filePath}`);
  }

  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = ProjectStateSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(formatZodError(result.error, filePath));
  }

  return result.data;
}

export function writeProjectState(projectName: string, state: ProjectState, ptahHome?: string): void {
  const projectDir = getProjectDir(projectName, ptahHome);
  const filePath = join(projectDir, 'STATE.json');

  const result = ProjectStateSchema.safeParse(state);
  if (!result.success) {
    throw new Error(formatZodError(result.error, filePath));
  }

  writeFileSync(filePath, JSON.stringify(result.data, null, 2));
}

export function updateProjectState(
  projectName: string,
  updates: Partial<ProjectState>,
  ptahHome?: string
): ProjectState {
  const current = readProjectState(projectName, ptahHome);
  const updated = { ...current, ...updates, last_session: new Date().toISOString() };
  writeProjectState(projectName, updated, ptahHome);
  return updated;
}

// ── Global Config ──────────────────────────────────────────────

export function readGlobalConfig(ptahHome?: string): GlobalConfig {
  const filePath = getGlobalConfigPath(ptahHome ?? getPtahHome());

  if (!existsSync(filePath)) {
    throw new Error(`Global config not found: ${filePath}`);
  }

  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = GlobalConfigSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(formatZodError(result.error, filePath));
  }

  return result.data;
}
```
  </action>
  <acceptance_criteria>
    - `src/lib/state.ts` exports `readProjectConfig`, `writeProjectConfig`
    - `src/lib/state.ts` exports `readProjectState`, `writeProjectState`, `updateProjectState`
    - `src/lib/state.ts` exports `readGlobalConfig`
    - All read functions use `safeParse` and throw formatted errors on validation failure
    - `updateProjectState` merges partial updates and sets `last_session` timestamp
  </acceptance_criteria>
  <verify>
    <automated>test -f src/lib/state.ts && grep -q "readProjectConfig" src/lib/state.ts && grep -q "writeProjectState" src/lib/state.ts && grep -q "safeParse" src/lib/state.ts && grep -q "updateProjectState" src/lib/state.ts && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>Type-safe state management with zod validation, formatted error messages, and atomic state updates.</done>
</task>

</tasks>

<verification>
1. `npm run typecheck` — no TypeScript errors
2. Schemas match template file shapes (config.json, STATE.json)
3. All exported types are usable from other modules
</verification>

<success_criteria>
- All config and state schemas defined with proper defaults
- Read/write operations validate against schemas
- Invalid data produces clear, actionable error messages
- Type exports enable downstream TypeScript consumers
- 8 lifecycle states cover full orchestration workflow
</success_criteria>

<output>
After completion, create `.planning/phases/01-workspace-foundation/01-03-SUMMARY.md`
</output>
