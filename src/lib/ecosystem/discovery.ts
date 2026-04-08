import { RepoProfile, Contract } from '../schemas.js';

/**
 * Discovers potential contracts between registered repositories.
 * 
 * Logic:
 * 1. Explicit dependencies: If Repo B lists Repo A in its dependencies (e.g. package.json),
 *    this is a high-confidence contract (1.0).
 * 2. Role matching: If Repo B's role mentions Repo A's name, 
 *    this is a medium-confidence contract (0.7).
 * 3. Export matching: If Repo B's exports_summary mentions Repo A's name,
 *    this is a medium-confidence contract (0.6).
 */
export function discoverContracts(profiles: RepoProfile[]): Contract[] {
  const contracts: Contract[] = [];
  const now = new Date().toISOString();

  // Create a map for quick lookup by name
  const profileMap = new Map<string, RepoProfile>();
  for (const p of profiles) {
    profileMap.set(p.name, p);
  }

  for (const consumer of profiles) {
    // 1. Check for explicit dependencies
    for (const depName of consumer.dependencies) {
      if (profileMap.has(depName)) {
        contracts.push({
          provider: depName,
          consumer: consumer.name,
          type: 'npm dependency',
          confidence: 1.0,
          evidence: `Explicitly listed in dependencies`,
          confirmed: true,
          discovered_at: now
        });
      }
    }

    // 2. Role-based matching (Heuristic)
    for (const provider of profiles) {
      if (provider.name === consumer.name) continue;

      // Check if consumer's role mentions provider's name or provider's role
      const roleMatch = consumer.role.toLowerCase().includes(provider.name.toLowerCase()) || 
                       (provider.role && consumer.role.toLowerCase().includes(provider.role.toLowerCase()));

      if (roleMatch) {
        // Avoid duplicate if already found by explicit dependency
        if (!contracts.some(c => c.provider === provider.name && c.consumer === consumer.name)) {
          contracts.push({
            provider: provider.name,
            consumer: consumer.name,
            type: 'role match',
            confidence: 0.7,
            evidence: `Consumer role '${consumer.role}' mentions provider name '${provider.name}' or role '${provider.role}'`,
            confirmed: false,
            discovered_at: now
          });
        }
      }

      // 3. Export matching (Heuristic)
      if (consumer.exports_summary && consumer.exports_summary.toLowerCase().includes(provider.name.toLowerCase())) {
        if (!contracts.some(c => c.provider === provider.name && c.consumer === consumer.name)) {
          contracts.push({
            provider: provider.name,
            consumer: consumer.name,
            type: 'export match',
            confidence: 0.6,
            evidence: `Consumer exports mentions provider name '${provider.name}'`,
            confirmed: false,
            discovered_at: now
          });
        }
      }
    }
  }

  return contracts;
}
