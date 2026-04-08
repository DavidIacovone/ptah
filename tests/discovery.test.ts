import { describe, it, expect } from 'vitest';
import { discoverContracts } from '../src/lib/ecosystem/discovery.js';
import { RepoProfile } from '../src/lib/schemas.js';

describe('discovery', () => {
  const mockProfiles: RepoProfile[] = [
    {
      name: 'api-service',
      path: '/path/to/api',
      role: 'backend',
      framework: 'NestJS',
      language: 'TypeScript',
      key_directories: ['src'],
      exports_summary: 'POST /users, GET /users/:id',
      dependencies: [],
      tech_fingerprint: { api_style: 'REST', orm: 'TypeORM', test_framework: 'jest', ci: 'github' },
      registered_at: '2026-04-08T10:00:00Z',
      learned_at: '2026-04-08T10:05:00Z'
    },
    {
      name: 'web-app',
      path: '/path/to/web',
      role: 'frontend calling api-service',
      framework: 'Next.js',
      language: 'TypeScript',
      key_directories: ['src'],
      exports_summary: '',
      dependencies: ['api-service'],
      tech_fingerprint: { api_style: null, orm: null, test_framework: 'vitest', ci: 'github' },
      registered_at: '2026-04-08T10:01:00Z',
      learned_at: '2026-04-08T10:06:00Z'
    },
    {
      name: 'shared-ui',
      path: '/path/to/ui',
      role: 'shared-lib',
      framework: 'React',
      language: 'TypeScript',
      key_directories: ['src'],
      exports_summary: 'Button, Card, Input',
      dependencies: [],
      tech_fingerprint: { api_style: null, orm: null, test_framework: 'vitest', ci: 'github' },
      registered_at: '2026-04-08T10:02:00Z',
      learned_at: '2026-04-08T10:07:00Z'
    }
  ];

  it('detects explicit npm dependencies with 1.0 confidence', () => {
    const contracts = discoverContracts(mockProfiles);
    const explicit = contracts.find(c => c.provider === 'api-service' && c.consumer === 'web-app');
    expect(explicit).toBeDefined();
    expect(explicit?.confidence).toBe(1.0);
    expect(explicit?.type).toBe('npm dependency');
  });

  it('detects role-based matches with 0.7 confidence', () => {
    // web-app role is "frontend calling api-service"
    const contracts = discoverContracts(mockProfiles);
    const roleMatch = contracts.find(c => c.provider === 'api-service' && c.consumer === 'web-app' && c.type === 'npm dependency');
    // In our logic, if explicit is found, role match is skipped. 
    // Let's modify a mock to test role match alone.
    
    const roleOnlyProfiles = [
      mockProfiles[0],
      { ...mockProfiles[1], dependencies: [] }
    ];
    
    const contracts2 = discoverContracts(roleOnlyProfiles);
    const match = contracts2.find(c => c.provider === 'api-service' && c.consumer === 'web-app');
    expect(match).toBeDefined();
    expect(match?.confidence).toBe(0.7);
    expect(match?.type).toBe('role match');
  });

  it('detects export-based matches with 0.6 confidence', () => {
    const exportProfiles = [
      mockProfiles[2], // shared-ui
      { ...mockProfiles[1], dependencies: [], exports_summary: 'uses shared-ui components' }
    ];
    
    const contracts = discoverContracts(exportProfiles);
    const match = contracts.find(c => c.provider === 'shared-ui' && c.consumer === 'web-app');
    expect(match).toBeDefined();
    expect(match?.confidence).toBe(0.6);
    expect(match?.type).toBe('export match');
  });
});
