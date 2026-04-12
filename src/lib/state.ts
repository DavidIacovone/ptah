/**
 * @module state
 *
 * Type-safe state management utilities for Ptah projects.
 *
 * This module provides validated read/write access to all JSON data files
 * that Ptah persists to disk: project configs, project state, global config,
 * repo profiles, and task plans.
 *
 * **All reads validate against Zod schemas** — malformed or missing fields
 * are caught immediately with descriptive error messages.
 *
 * **All writes validate before persisting** — invalid data never reaches disk.
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

/**
 * Format a Zod validation error into a human-readable string.
 *
 * @param error - The Zod validation error.
 * @param filePath - Absolute path to the file that failed validation.
 * @returns Multi-line error message listing each invalid field.
 */
function formatZodError(error: ZodError, filePath: string): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `  - ${path || 'root'}: ${issue.message}`;
  });
  return `Validation error in ${filePath}:\n${issues.join('\n')}`;
}

// ── Project Config ─────────────────────────────────────────────

/**
 * Read and validate a project's `config.json`.
 *
 * @param projectName - Name of the project.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns Validated project configuration.
 * @throws If the file is missing or fails schema validation.
 */
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

/**
 * Validate and write a project's `config.json`.
 *
 * @param projectName - Name of the project.
 * @param config - Configuration object to persist.
 * @param ptahHome - Optional Ptah home directory override.
 * @throws If the config fails schema validation.
 */
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

/**
 * Read and validate a project's `STATE.json`.
 *
 * @param projectName - Name of the project.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns Validated project state.
 * @throws If the file is missing or fails schema validation.
 */
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

/**
 * Validate and write a project's `STATE.json`.
 *
 * @param projectName - Name of the project.
 * @param state - State object to persist.
 * @param ptahHome - Optional Ptah home directory override.
 * @throws If the state fails schema validation.
 */
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

/**
 * Apply a partial update to a project's state.
 *
 * Reads the current state, merges the provided fields, stamps
 * `last_session` with the current time, and writes back.
 *
 * @param projectName - Name of the project.
 * @param updates - Fields to merge into the current state.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns The full updated state after merging.
 */
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

/**
 * Read and validate the global `config.json` at `~/.ptah/config.json`.
 *
 * @param ptahHome - Optional Ptah home directory override.
 * @returns Validated global configuration.
 * @throws If the file is missing or fails schema validation.
 */
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

/**
 * Get the directory that holds repo profile JSON files for a project.
 *
 * @param projectName - Name of the project.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns Absolute path to `<project>/repos/`.
 */
function getReposDir(projectName: string, ptahHome?: string): string {
  return join(getProjectDir(projectName, ptahHome), 'repos');
}

/**
 * Get the file path for a specific repo profile.
 *
 * @param projectName - Name of the project.
 * @param repoName - Name of the repository.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns Absolute path to `<project>/repos/<repoName>.json`.
 */
function getRepoProfilePath(projectName: string, repoName: string, ptahHome?: string): string {
  return join(getReposDir(projectName, ptahHome), `${repoName}.json`);
}

/**
 * Validate and write a repository profile to disk.
 *
 * Creates the `repos/` directory if it doesn't exist.
 *
 * @param projectName - Name of the project.
 * @param profile - Repository profile to persist.
 * @param ptahHome - Optional Ptah home directory override.
 * @throws If the profile fails schema validation.
 */
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

/**
 * Read and validate a single repository profile.
 *
 * @param projectName - Name of the project.
 * @param repoName - Name of the repository.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns Validated repository profile.
 * @throws If the file is missing or fails schema validation.
 */
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

/**
 * List all valid repository profiles for a project.
 *
 * Reads every `.json` file in the `repos/` directory, validates each against
 * `RepoProfileSchema`, and silently skips any that fail validation.
 *
 * @param projectName - Name of the project.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns Array of validated repository profiles (may be empty).
 */
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

/**
 * Auto-detect the active project when only one project exists.
 *
 * Scans `~/.ptah/projects/` for directories that contain a `config.json`.
 * Returns the project name if exactly one is found, `null` otherwise.
 *
 * @param ptahHome - Optional Ptah home directory override.
 * @returns The single project name, or `null` if zero or multiple projects exist.
 */
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

/**
 * Delete a repository profile from disk.
 *
 * @param projectName - Name of the project.
 * @param repoName - Name of the repository to remove.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns `true` if the file was deleted, `false` if it didn't exist.
 */
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

/**
 * Get the directory that holds plan JSON files for a project.
 *
 * @param projectName - Name of the project.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns Absolute path to `<project>/plans/`.
 */
function getPlansDir(projectName: string, ptahHome?: string): string {
  return join(getProjectDir(projectName, ptahHome), 'plans');
}

/**
 * Validate and write a task plan to disk.
 *
 * Creates the `plans/` directory if it doesn't exist.
 *
 * @param projectName - Name of the project.
 * @param plan - Plan object to persist.
 * @param ptahHome - Optional Ptah home directory override.
 * @throws If the plan fails schema validation.
 */
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

/**
 * Read and validate a task plan from disk.
 *
 * @param projectName - Name of the project.
 * @param planId - Unique identifier of the plan.
 * @param ptahHome - Optional Ptah home directory override.
 * @returns Validated plan object.
 * @throws If the file is missing or fails schema validation.
 */
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
