/**
 * Type-safe state management utilities for Ptah projects.
 *
 * All read operations validate against zod schemas.
 * All write operations validate before persisting.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ZodError } from 'zod';
import {
  ProjectConfigSchema,
  ProjectStateSchema,
  GlobalConfigSchema,
  RepoProfileSchema,
  PlanSchema,
  type ProjectConfig,
  type ProjectState,
  type GlobalConfig,
  type RepoProfile,
  type Plan,
} from './schemas.js';
import { getProjectDir, getProjectsDir, getGlobalConfigPath, getPtahHome } from './paths.js';

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

// ── Repo Profiles ──────────────────────────────────────────────

function getReposDir(projectName: string, ptahHome?: string): string {
  return join(getProjectDir(projectName, ptahHome), 'repos');
}

function getRepoProfilePath(projectName: string, repoName: string, ptahHome?: string): string {
  return join(getReposDir(projectName, ptahHome), `${repoName}.json`);
}

export function writeRepoProfile(
  projectName: string,
  profile: RepoProfile,
  ptahHome?: string
): void {
  const reposDir = getReposDir(projectName, ptahHome);
  mkdirSync(reposDir, { recursive: true });

  const filePath = getRepoProfilePath(projectName, profile.name, ptahHome);

  const result = RepoProfileSchema.safeParse(profile);
  if (!result.success) {
    throw new Error(formatZodError(result.error, filePath));
  }

  writeFileSync(filePath, JSON.stringify(result.data, null, 2));
}

export function readRepoProfile(
  projectName: string,
  repoName: string,
  ptahHome?: string
): RepoProfile {
  const filePath = getRepoProfilePath(projectName, repoName, ptahHome);

  if (!existsSync(filePath)) {
    throw new Error(`Repo profile not found: ${filePath}`);
  }

  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = RepoProfileSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(formatZodError(result.error, filePath));
  }

  return result.data;
}

export function listRepoProfiles(
  projectName: string,
  ptahHome?: string
): RepoProfile[] {
  const reposDir = getReposDir(projectName, ptahHome);

  if (!existsSync(reposDir)) {
    return [];
  }

  const files = readdirSync(reposDir).filter((f) => f.endsWith('.json'));
  const profiles: RepoProfile[] = [];

  for (const file of files) {
    const filePath = join(reposDir, file);
    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
      const result = RepoProfileSchema.safeParse(raw);
      if (result.success) {
        profiles.push(result.data);
      }
    } catch {
      // Skip invalid profile files
    }
  }

  return profiles;
}

export function findProject(ptahHome?: string): string | null {
  const projectsDir = getProjectsDir(ptahHome);
  if (!existsSync(projectsDir)) return null;

  const entries = readdirSync(projectsDir).filter((entry: string) => {
    const entryPath = join(projectsDir, entry);
    return statSync(entryPath).isDirectory() && existsSync(join(entryPath, 'config.json'));
  });

  if (entries.length === 1) return entries[0];
  return null;
}

export function deleteRepoProfile(
  projectName: string,
  repoName: string,
  ptahHome?: string
): boolean {
  const filePath = getRepoProfilePath(projectName, repoName, ptahHome);

  if (!existsSync(filePath)) {
    return false;
  }

  unlinkSync(filePath);
  return true;
}

// ── Plans ───────────────────────────────────────────────────────

function getPlansDir(projectName: string, ptahHome?: string): string {
  return join(getProjectDir(projectName, ptahHome), 'plans');
}

export function writePlan(
  projectName: string,
  plan: Plan,
  ptahHome?: string
): void {
  const plansDir = getPlansDir(projectName, ptahHome);
  mkdirSync(plansDir, { recursive: true });

  const filePath = join(plansDir, `${plan.id}.json`);

  const result = PlanSchema.safeParse(plan);
  if (!result.success) {
    throw new Error(formatZodError(result.error, filePath));
  }

  writeFileSync(filePath, JSON.stringify(result.data, null, 2));
}

export function readPlan(
  projectName: string,
  planId: string,
  ptahHome?: string
): Plan {
  const filePath = join(getPlansDir(projectName, ptahHome), `${planId}.json`);

  if (!existsSync(filePath)) {
    throw new Error(`Plan not found: ${filePath}`);
  }

  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = PlanSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(formatZodError(result.error, filePath));
  }

  return result.data;
}
