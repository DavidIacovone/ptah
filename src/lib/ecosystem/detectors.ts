/**
 * @module detectors
 *
 * Static lookup tables for framework, language, and directory detection.
 *
 * Used by the {@link scanner} module to fingerprint repositories based on
 * manifest files (e.g. `package.json`, `go.mod`), dependency names, file
 * extensions, and directory naming conventions.
 */

/** Pattern for detecting a framework from manifest files and dependency names. */
export interface FrameworkPattern {
  /** Human-readable framework name (e.g. `"React"`, `"NestJS"`). */
  name: string;
  /** Manifest files whose presence suggests this framework (e.g. `["package.json"]`). */
  files?: string[];
  /** npm dependency names that confirm this framework (e.g. `["react"]`). */
  deps?: string[];
}

/**
 * Ordered list of framework detection patterns.
 *
 * More specific frameworks should appear before generic ones
 * (e.g. `NestJS` before `Express`) to avoid false positives.
 */
export const FRAMEWORKS: FrameworkPattern[] = [
  { name: 'React', files: ['package.json'], deps: ['react'] },
  { name: 'NestJS', files: ['package.json'], deps: ['@nestjs/core'] },
  { name: 'Next.js', files: ['package.json'], deps: ['next'] },
  { name: 'Express', files: ['package.json'], deps: ['express'] },
  { name: 'Go', files: ['go.mod'] },
  { name: 'Python', files: ['requirements.txt', 'pyproject.toml'] },
  { name: 'Rust', files: ['Cargo.toml'] },
];

/** Pattern for detecting a programming language from file extensions. */
export interface LanguagePattern {
  /** Human-readable language name (e.g. `"TypeScript"`). */
  name: string;
  /** File extensions associated with this language (e.g. `[".ts", ".tsx"]`). */
  extensions: string[];
}

/** Supported language detection patterns, ordered by specificity. */
export const LANGUAGES: LanguagePattern[] = [
  { name: 'TypeScript', extensions: ['.ts', '.tsx'] },
  { name: 'JavaScript', extensions: ['.js', '.jsx', '.mjs', '.cjs'] },
  { name: 'Go', extensions: ['.go'] },
  { name: 'Python', extensions: ['.py'] },
  { name: 'Rust', extensions: ['.rs'] },
  { name: 'Markdown', extensions: ['.md'] },
];

/**
 * Directory names that are considered architecturally significant.
 *
 * When found at the top level of a repository, these directories are recorded
 * in the repo profile's `key_directories` field.
 */
export const KEY_DIRECTORIES = [
  'src',
  'lib',
  'api',
  'docs',
  'tests',
  'test',
  'spec',
  'migrations',
  'cmd',
  'internal',
  'pkg',
];
