/**
 * @module scanner
 *
 * Repository structure scanner.
 *
 * Detects frameworks, primary languages, and key directories by analyzing
 * manifest files, file extensions, and directory structure. Used by the
 * `ptah learn` command to enrich repo profiles.
 */

import fg from 'fast-glob';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { FRAMEWORKS, LANGUAGES, KEY_DIRECTORIES } from './detectors.js';

/** Results returned by {@link scanRepo}. */
export interface ScanResult {
  framework: string | null;
  language: string | null;
  key_directories: string[];
}

/**
 * Deeply scan a repository to detect its framework, primary language,
 * and architecturally significant directories.
 *
 * Performs two passes:
 * 1. **Root-level manifest scan** — checks for `package.json`, `go.mod`,
 *    `Cargo.toml`, etc. and matches against known framework patterns.
 * 2. **Full tree scan** — counts file extensions to determine the dominant
 *    language, and identifies key directories like `src/`, `tests/`, etc.
 *
 * @param repoPath - Absolute path to the repository root.
 * @returns Detected framework, language, and key directories.
 */
export async function scanRepo(repoPath: string): Promise<ScanResult> {
  // Find all files in the root to detect manifests
  const rootFiles = await fg(['*'], {
    cwd: repoPath,
    deep: 1,
    onlyFiles: true,
  });

  let detectedFramework: string | null = null;
  let detectedLanguage: string | null = null;

  // 1. Detect Framework by manifests
  for (const framework of FRAMEWORKS) {
    if (framework.files && framework.files.some(f => rootFiles.includes(f))) {
      // For Node projects, check dependencies
      if (rootFiles.includes('package.json')) {
        try {
          const pkg = JSON.parse(readFileSync(join(repoPath, 'package.json'), 'utf-8'));
          const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
          };
          if (framework.deps && framework.deps.some(d => allDeps[d])) {
            detectedFramework = framework.name;
            break;
          }
        } catch {
          // Ignore invalid package.json
        }
      } else {
        // If not a node project, the existence of the file is enough for some
        detectedFramework = framework.name;
        break;
      }
    }
  }

  // 2. Scan project for language frequency and key directories
  const allProjectFiles = await fg(['**/*'], {
    cwd: repoPath,
    deep: 5,
    onlyFiles: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/package-lock.json', '**/yarn.lock'],
  });

  const allProjectDirs = await fg(['*'], {
    cwd: repoPath,
    deep: 1,
    onlyDirectories: true,
  });

  // Frequency of extensions
  const extCounts: Record<string, number> = {};
  for (const file of allProjectFiles) {
    const ext = extname(file);
    if (ext) {
      extCounts[ext] = (extCounts[ext] || 0) + 1;
    }
  }

  // Map extensions to languages
  const langCounts: Record<string, number> = {};
  for (const [ext, count] of Object.entries(extCounts)) {
    const lang = LANGUAGES.find(l => l.extensions.includes(ext));
    if (lang) {
      langCounts[lang.name] = (langCounts[lang.name] || 0) + count;
    }
  }

  // Find most frequent language
  const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
  if (sortedLangs.length > 0) {
    detectedLanguage = sortedLangs[0][0];
  }

  // If we found a framework but it's one of those that defines the language
  if (detectedFramework === 'Go') detectedLanguage = 'Go';
  if (detectedFramework === 'Rust') detectedLanguage = 'Rust';
  if (detectedFramework === 'Python') detectedLanguage = 'Python';

  // 3. Detect key directories
  const key_directories = allProjectDirs
    .filter(dir => KEY_DIRECTORIES.includes(basename(dir)))
    .map(dir => basename(dir));

  return {
    framework: detectedFramework,
    language: detectedLanguage,
    key_directories,
  };
}

/**
 * Extract public entry points or exports summary from a repository.
 *
 * For Node.js projects, reads `exports` or `main` from `package.json`.
 * For Go projects, returns `main.go`. For Rust, returns `src/lib.rs or src/main.rs`.
 *
 * @param repoPath - Absolute path to the repository root.
 * @returns Human-readable summary of the repo's public exports, or `"unknown"`.
 */
export function extractExports(repoPath: string): string {
  const pkgPath = join(repoPath, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.exports) {
        if (typeof pkg.exports === 'string') {
          return pkg.exports;
        }
        if (typeof pkg.exports === 'object') {
          const keys = Object.keys(pkg.exports);
          if (keys.length > 5) {
            return `${keys.slice(0, 5).join(', ')} (+ ${keys.length - 5} more)`;
          }
          return keys.join(', ');
        }
      }
      if (pkg.main) {
        return pkg.main;
      }
    } catch {
      // Ignore
    }
  }

  // For Go
  if (existsSync(join(repoPath, 'go.mod'))) {
    return 'main.go';
  }

  // For Rust
  if (existsSync(join(repoPath, 'Cargo.toml'))) {
    return 'src/lib.rs or src/main.rs';
  }

  return 'unknown';
}
