/**
 * Type-safe state management utilities for Ptah projects.
 *
 * All read operations validate against zod schemas.
 * All write operations validate before persisting.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

export function writeProjectConfig(
  projectName: string,
  config: ProjectConfig,
  ptahHome?: string
): void {
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

export function writeProjectState(
  projectName: string,
  state: ProjectState,
  ptahHome?: string
): void {
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
