import { describe, it, expect } from 'vitest';
import { discoverContracts } from '../src/lib/ecosystem/discovery.js';
import { RepoProfile } from '../src/lib/schemas.js';

describe('discovery', () => {
  const profiles: RepoProfile[] = [
    {
      name: 'auth-service',
      path: '/path/to/auth-service',
      role: 'Identity provider',
      framework: 'NestJS',
      language: 'TypeScript',
      key_directories: ['src'],
      exports_summary: 'POST /auth/login\nPOST /auth/register',
      dependencies: ['@nestjs/core', 'jose'],
      tech_fingerprint: {
        api_style: 'REST',
        orm: 'TypeORM',
        test_framework: 'Jest',
        ci: 'GitHub Actions'
      },
      registered_at: '2026-04-07T00:00:00Z',
      learned_at: '2026-04-07T00:00:00Z'
    },
    {
      name: 'web-app',
      path: '/path/to/web-app',
      role: 'Frontend app',
      framework: 'React',
      language: 'TypeScript',
      key_directories: ['src'],
      exports_summary: '',
      dependencies: ['react', 'auth-service'], // Explicit dependency on 'auth-service'
      tech_fingerprint: {
        api_style: 'REST',
        orm: null,
        test_framework: 'Vitest',
        ci: 'GitHub Actions'
      },
      registered_at: '2026-04-07T00:00:00Z',
      learned_at: '2026-04-07T00:00:00Z'
    },
    {
      name: 'user-profile',
      path: '/path/to/user-profile',
      role: 'User management',
      framework: 'Express',
      language: 'TypeScript',
      key_directories: ['src'],
      exports_summary: 'GET /profile/:id',
      dependencies: ['express'],
      tech_fingerprint: {
        api_style: 'REST',
        orm: 'Prisma',
        test_framework: 'Jest',
        ci: 'GitLab'
      },
      registered_at: '2026-04-07T00:00:00Z',
      learned_at: '2026-04-07T00:00:00Z'
    }
  ];

  it('should detect explicit dependencies from package.json', () => {
    const contracts = discoverContracts(profiles);
    const authContract = contracts.find(c => c.provider === 'auth-service' && c.consumer === 'web-app');
    
    expect(authContract).toBeDefined();
    expect(authContract?.confidence).toBe(1.0);
    expect(authContract?.type).toBe('npm dependency');
  });

  it('should detect potential dependencies from role matching', () => {
     // user-profile role is "User management"
     // Suppose we add another repo that mentions "user management" in its role or dependencies
     const profilesWithMatchingRole: RepoProfile[] = [
       ...profiles,
       {
         name: 'admin-panel',
         path: '/path/to/admin-panel',
         role: 'Admin UI for User management', // Mentions 'User management'
         framework: 'Vue',
         language: 'TypeScript',
         key_directories: ['src'],
         exports_summary: '',
         dependencies: ['vue'],
         tech_fingerprint: {
           api_style: 'REST',
           orm: null,
           test_framework: 'Vitest',
           ci: 'GitHub Actions'
         },
         registered_at: '2026-04-07T00:00:00Z',
         learned_at: '2026-04-07T00:00:00Z'
       }
     ];
     
     const contracts = discoverContracts(profilesWithMatchingRole);
     const adminToUser = contracts.find(c => c.provider === 'user-profile' && c.consumer === 'admin-panel');
     
     expect(adminToUser).toBeDefined();
     expect(adminToUser?.confidence).toBeGreaterThan(0);
     expect(adminToUser?.confidence).toBeLessThan(1.0);
  });
});
