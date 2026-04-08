import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RepoProfileSchema, ContractSchema, type RepoProfile } from '../src/lib/schemas';
import { writeRepoProfile, readRepoProfile, listRepoProfiles } from '../src/lib/state';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('RepoProfileSchema', () => {
  it('should include exports_summary with a default empty string', () => {
    const profile = {
      name: 'test-repo',
      path: '/path/to/repo',
      role: 'core-service',
      registered_at: '2026-04-07',
    };
    const result = RepoProfileSchema.parse(profile);
    expect(result.exports_summary).toBe('');
  });
});

describe('ContractSchema', () => {
  it('should validate a correct contract with number confidence and string type', () => {
    const contract = {
      provider: 'repo-a',
      consumer: 'repo-b',
      type: 'api',
      confidence: 0.9,
      evidence: 'Matched some routes',
      confirmed: true,
      discovered_at: '2026-04-07',
    };
    const result = ContractSchema.parse(contract);
    expect(result.confidence).toBe(0.9);
    expect(result.type).toBe('api');
  });

  it('should fail if confidence is not a number', () => {
    const contract = {
      provider: 'repo-a',
      consumer: 'repo-b',
      type: 'api',
      confidence: 'high',
      evidence: 'Matched some routes',
    };
    expect(() => ContractSchema.parse(contract as any)).toThrow();
  });
});

describe('State Management', () => {
  let tmpHome: string;
  const projectName = 'test-project';

  beforeEach(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'ptah-test-'));
  });

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true });
  });

  it('should write and read a repo profile', () => {
    const profile: RepoProfile = {
      name: 'my-repo',
      path: '/path/to/my-repo',
      role: 'core-service',
      framework: 'react',
      language: 'typescript',
      key_directories: ['src', 'tests'],
      exports_summary: '',
      dependencies: [],
      tech_fingerprint: {
        api_style: 'rest',
        orm: 'prisma',
        test_framework: 'vitest',
        ci: 'github-actions',
      },
      registered_at: new Date().toISOString(),
      learned_at: null,
    };

    writeRepoProfile(projectName, profile, tmpHome);

    const filePath = join(tmpHome, 'projects', projectName, 'repos', 'my-repo.json');
    expect(existsSync(filePath)).toBe(true);

    const readBack = readRepoProfile(projectName, 'my-repo', tmpHome);
    expect(readBack).toEqual(profile);
  });

  it('should list repo profiles', () => {
    const profile1: RepoProfile = {
      name: 'repo-1',
      path: '/path/to/repo-1',
      role: 'service',
      registered_at: new Date().toISOString(),
      exports_summary: '',
      key_directories: [],
      dependencies: [],
      tech_fingerprint: {},
      framework: null,
      language: null,
      learned_at: null,
    };
    const profile2: RepoProfile = {
      name: 'repo-2',
      path: '/path/to/repo-2',
      role: 'client',
      registered_at: new Date().toISOString(),
      exports_summary: '',
      key_directories: [],
      dependencies: [],
      tech_fingerprint: {},
      framework: null,
      language: null,
      learned_at: null,
    };

    writeRepoProfile(projectName, profile1, tmpHome);
    writeRepoProfile(projectName, profile2, tmpHome);

    const profiles = listRepoProfiles(projectName, tmpHome);
    expect(profiles).toHaveLength(2);
    expect(profiles.map(p => p.name)).toContain('repo-1');
    expect(profiles.map(p => p.name)).toContain('repo-2');
  });
});
