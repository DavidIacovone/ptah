import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanRepo } from '../src/lib/ecosystem/scanner.js';

describe('scanner', () => {
  let tmpRepoPath: string;

  beforeEach(() => {
    tmpRepoPath = mkdtempSync(join(tmpdir(), 'ptah-repo-test-'));
  });

  afterEach(() => {
    rmSync(tmpRepoPath, { recursive: true, force: true });
  });

  it('should detect a TypeScript React project', async () => {
    // Mock package.json
    writeFileSync(
      join(tmpRepoPath, 'package.json'),
      JSON.stringify({
        dependencies: {
          react: '^18.0.0',
        },
      })
    );

    // Mock some TS files
    mkdirSync(join(tmpRepoPath, 'src'));
    writeFileSync(join(tmpRepoPath, 'src/App.tsx'), '');
    writeFileSync(join(tmpRepoPath, 'src/index.ts'), '');

    const result = await scanRepo(tmpRepoPath);

    expect(result.framework).toBe('React');
    expect(result.language).toBe('TypeScript');
    expect(result.key_directories).toContain('src');
  });

  it('should detect a NestJS project', async () => {
    writeFileSync(
      join(tmpRepoPath, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@nestjs/core': '^10.0.0',
        },
      })
    );

    mkdirSync(join(tmpRepoPath, 'src'));
    writeFileSync(join(tmpRepoPath, 'src/main.ts'), '');

    const result = await scanRepo(tmpRepoPath);

    expect(result.framework).toBe('NestJS');
    expect(result.language).toBe('TypeScript');
  });

  it('should detect a Go project', async () => {
    writeFileSync(join(tmpRepoPath, 'go.mod'), 'module test-go-project');
    mkdirSync(join(tmpRepoPath, 'cmd'));
    writeFileSync(join(tmpRepoPath, 'cmd/main.go'), '');

    const result = await scanRepo(tmpRepoPath);

    expect(result.framework).toBe('Go');
    expect(result.language).toBe('Go');
    expect(result.key_directories).toContain('cmd');
  });

  it('should detect language by file frequency if no framework detected', async () => {
    mkdirSync(join(tmpRepoPath, 'lib'));
    writeFileSync(join(tmpRepoPath, 'lib/helper.py'), '');
    writeFileSync(join(tmpRepoPath, 'lib/utils.py'), '');

    const result = await scanRepo(tmpRepoPath);

    expect(result.framework).toBeNull();
    expect(result.language).toBe('Python');
  });
});
