/**
 * ptah register — Register a repository with the current project
 *
 * Validates the target path is a directory (and ideally a git repo),
 * auto-detects a role heuristic, creates a stub RepoProfile, and
 * increments repos_registered in project state.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, resolve, join } from 'node:path';
import { writeRepoProfile, readRepoProfile, listRepoProfiles, updateProjectState, findProject } from '../lib/state.js';
import { getProjectsDir, getProjectDir } from '../lib/paths.js';
import type { RepoProfile } from '../lib/schemas.js';

interface RegisterOptions {
  path: string;
  role: string | null;
  project: string | null;
}

function parseRegisterArgs(args: string[]): RegisterOptions {
  let targetPath = '.';
  let role: string | null = null;
  let project: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--role' && args[i + 1]) {
      role = args[++i];
    } else if (arg === '--project' && args[i + 1]) {
      project = args[++i];
    } else if (!arg.startsWith('--')) {
      targetPath = arg;
    }
  }

  return { path: targetPath, role, project };
}

/**
 * Auto-detect a repo role based on common heuristics.
 * Falls back to 'unknown' if nothing is detected.
 */
function detectRole(repoPath: string): string {
  const pkgPath = join(repoPath, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const allDeps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
      };
      const depNames = Object.keys(allDeps);

      // Backend frameworks
      if (depNames.includes('@nestjs/core')) return 'backend';
      if (depNames.includes('express')) return 'backend';
      if (depNames.includes('fastify')) return 'backend';
      if (depNames.includes('hono')) return 'backend';
      if (depNames.includes('koa')) return 'backend';

      // Frontend frameworks
      if (depNames.includes('next')) return 'frontend';
      if (depNames.includes('react')) return 'frontend';
      if (depNames.includes('vue')) return 'frontend';
      if (depNames.includes('svelte')) return 'frontend';
      if (depNames.includes('@angular/core')) return 'frontend';

      // Shared library indicators
      if (pkg.main || pkg.exports || pkg.types) return 'shared-lib';

      // Mobile
      if (depNames.includes('react-native')) return 'mobile';
      if (depNames.includes('expo')) return 'mobile';
    } catch {
      // Fall through
    }
  }

  // Python
  if (existsSync(join(repoPath, 'requirements.txt')) || existsSync(join(repoPath, 'pyproject.toml'))) {
    if (existsSync(join(repoPath, 'manage.py'))) return 'backend';
    return 'backend';
  }

  // Go
  if (existsSync(join(repoPath, 'go.mod'))) return 'backend';

  // Rust
  if (existsSync(join(repoPath, 'Cargo.toml'))) return 'backend';

  // Infrastructure
  if (existsSync(join(repoPath, 'terraform.tf')) || existsSync(join(repoPath, 'main.tf'))) return 'infra';
  if (existsSync(join(repoPath, 'docker-compose.yml')) || existsSync(join(repoPath, 'docker-compose.yaml'))) return 'infra';

  return 'unknown';
}

/**
 * Detect primary language from manifest files.
 */
function detectLanguage(repoPath: string): string | null {
  if (existsSync(join(repoPath, 'tsconfig.json'))) return 'TypeScript';
  if (existsSync(join(repoPath, 'package.json'))) return 'JavaScript';
  if (existsSync(join(repoPath, 'go.mod'))) return 'Go';
  if (existsSync(join(repoPath, 'Cargo.toml'))) return 'Rust';
  if (existsSync(join(repoPath, 'pyproject.toml')) || existsSync(join(repoPath, 'requirements.txt'))) return 'Python';
  if (existsSync(join(repoPath, 'build.gradle')) || existsSync(join(repoPath, 'pom.xml'))) return 'Java';
  return null;
}

/**
 * Detect framework from manifest files.
 */
function detectFramework(repoPath: string): string | null {
  const pkgPath = join(repoPath, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const allDeps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
      };
      const depNames = Object.keys(allDeps);

      if (depNames.includes('next')) return 'Next.js';
      if (depNames.includes('@nestjs/core')) return 'NestJS';
      if (depNames.includes('express')) return 'Express';
      if (depNames.includes('fastify')) return 'Fastify';
      if (depNames.includes('vue')) return 'Vue';
      if (depNames.includes('svelte')) return 'Svelte';
      if (depNames.includes('@angular/core')) return 'Angular';
      if (depNames.includes('react-native') || depNames.includes('expo')) return 'React Native';
      if (depNames.includes('react')) return 'React';
    } catch {
      // Fall through
    }
  }

  // Python frameworks
  if (existsSync(join(repoPath, 'manage.py'))) return 'Django';
  const reqPath = join(repoPath, 'requirements.txt');
  if (existsSync(reqPath)) {
    try {
      const reqs = readFileSync(reqPath, 'utf-8').toLowerCase();
      if (reqs.includes('fastapi')) return 'FastAPI';
      if (reqs.includes('flask')) return 'Flask';
      if (reqs.includes('django')) return 'Django';
    } catch {
      // Fall through
    }
  }

  return null;
}

export async function runRegister(args: string[]): Promise<void> {
  const { path: targetPath, role: explicitRole, project: explicitProject } = parseRegisterArgs(args);

  // Resolve path
  const resolvedPath = resolve(targetPath);

  // Validate target exists and is a directory
  if (!existsSync(resolvedPath)) {
    console.error(`Error: Path does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  if (!statSync(resolvedPath).isDirectory()) {
    console.error(`Error: Path is not a directory: ${resolvedPath}`);
    process.exit(1);
  }

  // Warn if not a git repo
  const isGitRepo = existsSync(join(resolvedPath, '.git'));
  if (!isGitRepo) {
    console.warn(`Warning: ${resolvedPath} is not a git repository.`);
  }

  // Determine project
  const projectName = explicitProject ?? findProject();
  if (!projectName) {
    console.error('Error: Could not determine project. Use --project <name> or ensure only one project exists.');
    console.error('Available projects: ptah list');
    process.exit(1);
  }

  // Auto-detect or use explicit role
  const repoName = basename(resolvedPath);
  const detectedRole = detectRole(resolvedPath);
  const role = explicitRole ?? detectedRole;

  // Detect framework and language for stub profile
  const framework = detectFramework(resolvedPath);
  const language = detectLanguage(resolvedPath);

  // Check if already registered
  try {
    readRepoProfile(projectName, repoName);
    console.error(`Error: Repository "${repoName}" is already registered in project "${projectName}".`);
    console.error('To update, run ptah:learn after registration.');
    process.exit(1);
  } catch {
    // Expected — repo not registered yet
  }

  // Create stub profile
  const profile: RepoProfile = {
    name: repoName,
    path: resolvedPath,
    role,
    framework,
    language,
    key_directories: [],
    exports_summary: '',
    dependencies: [],
    tech_fingerprint: {
      api_style: null,
      orm: null,
      test_framework: null,
      ci: null,
    },
    registered_at: new Date().toISOString(),
    learned_at: null,
  };

  // Persist
  writeRepoProfile(projectName, profile);

  // Update state
  updateProjectState(projectName, {
    repos_registered: await getRepoCount(projectName),
  });

  // Update ECOSYSTEM.md
  updateEcosystem(projectName, profile);

  // Display
  const roleNote = explicitRole ? role : `${role} (auto-detected)`;
  console.log(`
✓ Registered "${repoName}" in project "${projectName}"

  Path:       ${resolvedPath}
  Role:       ${roleNote}
  Framework:  ${framework ?? 'not detected'}
  Language:   ${language ?? 'not detected'}
  Profile:    repos/${repoName}.json

Next: Run ptah:learn to perform deep analysis of this repository.
`);
}

async function getRepoCount(projectName: string): Promise<number> {
  const { listRepoProfiles } = await import('../lib/state.js');
  return listRepoProfiles(projectName).length;
}

/**
 * Update ECOSYSTEM.md with a new repo entry.
 * Appends a row to the "Registered Repositories" table.
 */
function updateEcosystem(projectName: string, profile: RepoProfile): void {
  const projectDir = getProjectDir(projectName);
  const ecosystemPath = join(projectDir, 'ECOSYSTEM.md');

  if (!existsSync(ecosystemPath)) return;

  let content = readFileSync(ecosystemPath, 'utf-8');

  // Remove the "No repositories registered" placeholder
  content = content.replace(
    /^_No repositories registered yet\..*_\n?/m,
    ''
  );

  // Build the new row
  const row = `| ${profile.name} | ${profile.role} | ${profile.path} | ${profile.framework ?? '-'} | ${profile.language ?? '-'} |`;

  // Find the table and append row after the header separator
  const tableHeaderPattern = /\| Repository \| Role \| Path \| Framework \| Language \|\n\|[-|]+\|/;
  const match = content.match(tableHeaderPattern);

  if (match && match.index !== undefined) {
    const insertPos = match.index + match[0].length;
    content = content.slice(0, insertPos) + '\n' + row + content.slice(insertPos);
  }

  writeFileSync(ecosystemPath, content);
}
