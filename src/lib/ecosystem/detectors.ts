export interface FrameworkPattern {
  name: string;
  files?: string[];
  deps?: string[];
}

export const FRAMEWORKS: FrameworkPattern[] = [
  { name: 'React', files: ['package.json'], deps: ['react'] },
  { name: 'NestJS', files: ['package.json'], deps: ['@nestjs/core'] },
  { name: 'Next.js', files: ['package.json'], deps: ['next'] },
  { name: 'Express', files: ['package.json'], deps: ['express'] },
  { name: 'Go', files: ['go.mod'] },
  { name: 'Python', files: ['requirements.txt', 'pyproject.toml'] },
  { name: 'Rust', files: ['Cargo.toml'] },
];

export interface LanguagePattern {
  name: string;
  extensions: string[];
}

export const LANGUAGES: LanguagePattern[] = [
  { name: 'TypeScript', extensions: ['.ts', '.tsx'] },
  { name: 'JavaScript', extensions: ['.js', '.jsx', '.mjs', '.cjs'] },
  { name: 'Go', extensions: ['.go'] },
  { name: 'Python', extensions: ['.py'] },
  { name: 'Rust', extensions: ['.rs'] },
  { name: 'Markdown', extensions: ['.md'] },
];

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
