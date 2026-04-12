import { describe, it, expect } from 'vitest';
import { assignWaves } from '../src/lib/ecosystem/dag.js';
import type { Task, Contract } from '../src/lib/schemas.js';

function makeTask(overrides: Partial<Task> & { id: string; repo: string; description: string }): Task {
  return {
    status: 'pending',
    wave: 1,
    depends_on: [],
    diff: null,
    error: null,
    ...overrides,
  };
}

describe('assignWaves', () => {
  it('returns empty result for empty task list', () => {
    const result = assignWaves([]);
    expect(result.isValid).toBe(true);
    expect(result.totalWaves).toBe(0);
    expect(result.tasks).toHaveLength(0);
  });

  it('assigns all independent tasks to wave 1', () => {
    const tasks = [
      makeTask({ id: 't1', repo: 'repo-a', description: 'Task A' }),
      makeTask({ id: 't2', repo: 'repo-b', description: 'Task B' }),
      makeTask({ id: 't3', repo: 'repo-c', description: 'Task C' }),
    ];

    const result = assignWaves(tasks);

    expect(result.isValid).toBe(true);
    expect(result.totalWaves).toBe(1);
    expect(result.waveMap[1]).toEqual(['t1', 't2', 't3']);
    for (const task of result.tasks) {
      expect(task.wave).toBe(1);
    }
  });

  it('orders linear dependencies into sequential waves', () => {
    const tasks = [
      makeTask({ id: 't1', repo: 'repo-a', description: 'Foundation' }),
      makeTask({ id: 't2', repo: 'repo-b', description: 'Middle', depends_on: ['t1'] }),
      makeTask({ id: 't3', repo: 'repo-c', description: 'Top', depends_on: ['t2'] }),
    ];

    const result = assignWaves(tasks);

    expect(result.isValid).toBe(true);
    expect(result.totalWaves).toBe(3);
    expect(result.waveMap[1]).toEqual(['t1']);
    expect(result.waveMap[2]).toEqual(['t2']);
    expect(result.waveMap[3]).toEqual(['t3']);
  });

  it('places independent and dependent tasks correctly (diamond pattern)', () => {
    // t1 → t2, t3 (parallel) → t4
    const tasks = [
      makeTask({ id: 't1', repo: 'shared-types', description: 'Update types' }),
      makeTask({ id: 't2', repo: 'backend', description: 'Update API', depends_on: ['t1'] }),
      makeTask({ id: 't3', repo: 'frontend', description: 'Update UI', depends_on: ['t1'] }),
      makeTask({ id: 't4', repo: 'e2e-tests', description: 'Integration test', depends_on: ['t2', 't3'] }),
    ];

    const result = assignWaves(tasks);

    expect(result.isValid).toBe(true);
    expect(result.totalWaves).toBe(3);

    // Wave 1: shared-types (foundation)
    expect(result.waveMap[1]).toEqual(['t1']);

    // Wave 2: backend + frontend (parallel, both depend on t1)
    expect(result.waveMap[2]).toEqual(expect.arrayContaining(['t2', 't3']));
    expect(result.waveMap[2]).toHaveLength(2);

    // Wave 3: e2e-tests (depends on both t2 and t3)
    expect(result.waveMap[3]).toEqual(['t4']);
  });

  it('detects dependency cycles', () => {
    const tasks = [
      makeTask({ id: 't1', repo: 'repo-a', description: 'A', depends_on: ['t3'] }),
      makeTask({ id: 't2', repo: 'repo-b', description: 'B', depends_on: ['t1'] }),
      makeTask({ id: 't3', repo: 'repo-c', description: 'C', depends_on: ['t2'] }),
    ];

    const result = assignWaves(tasks);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cycle');
    expect(result.error).toContain('t1');
  });

  it('silently ignores dependencies on unknown tasks', () => {
    const tasks = [
      makeTask({ id: 't1', repo: 'repo-a', description: 'A', depends_on: ['unknown-task'] }),
      makeTask({ id: 't2', repo: 'repo-b', description: 'B' }),
    ];

    const result = assignWaves(tasks);

    expect(result.isValid).toBe(true);
    expect(result.totalWaves).toBe(1);
    expect(result.waveMap[1]).toEqual(expect.arrayContaining(['t1', 't2']));
  });

  it('enriches dependencies from confirmed contracts', () => {
    const tasks = [
      makeTask({ id: 't1', repo: 'shared-types', description: 'Update shared types' }),
      makeTask({ id: 't2', repo: 'backend', description: 'Update backend' }),
      makeTask({ id: 't3', repo: 'frontend', description: 'Update frontend' }),
    ];

    const contracts: Contract[] = [
      {
        provider: 'shared-types',
        consumer: 'backend',
        type: 'npm dependency',
        confidence: 1.0,
        evidence: 'package.json',
        confirmed: true,
        discovered_at: '2026-01-01',
      },
      {
        provider: 'shared-types',
        consumer: 'frontend',
        type: 'npm dependency',
        confidence: 1.0,
        evidence: 'package.json',
        confirmed: true,
        discovered_at: '2026-01-01',
      },
    ];

    const result = assignWaves(tasks, contracts);

    expect(result.isValid).toBe(true);
    expect(result.totalWaves).toBe(2);

    // Wave 1: shared-types (provider)
    expect(result.waveMap[1]).toEqual(['t1']);

    // Wave 2: backend + frontend (consumers, parallel)
    expect(result.waveMap[2]).toEqual(expect.arrayContaining(['t2', 't3']));
  });

  it('does not use unconfirmed contracts for dependency enrichment', () => {
    const tasks = [
      makeTask({ id: 't1', repo: 'repo-a', description: 'Task A' }),
      makeTask({ id: 't2', repo: 'repo-b', description: 'Task B' }),
    ];

    const contracts: Contract[] = [
      {
        provider: 'repo-a',
        consumer: 'repo-b',
        type: 'role match',
        confidence: 0.7,
        evidence: 'heuristic',
        confirmed: false,  // Not confirmed
        discovered_at: '2026-01-01',
      },
    ];

    const result = assignWaves(tasks, contracts);

    expect(result.isValid).toBe(true);
    expect(result.totalWaves).toBe(1);
    // Both in wave 1 since contract is unconfirmed
    expect(result.waveMap[1]).toEqual(expect.arrayContaining(['t1', 't2']));
  });
});
