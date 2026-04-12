/**
 * @module dag
 *
 * DAG Builder — Dependency-aware wave assignment for task plans.
 *
 * Builds a Directed Acyclic Graph from a plan's tasks, resolves
 * dependencies using explicit `depends_on` fields plus cross-repo
 * contract relationships, and assigns wave numbers via topological
 * sort (Kahn's algorithm).
 *
 * Wave N contains tasks whose prerequisites all completed in earlier
 * waves. Tasks with no dependencies land in Wave 1. Independent tasks
 * within the same wave run in parallel.
 *
 * @example
 * ```ts
 * import { assignWaves } from './dag.js';
 *
 * const result = assignWaves(plan.tasks, state.contracts);
 * if (result.isValid) {
 *   console.log(`${result.totalWaves} waves assigned`);
 * } else {
 *   console.error(result.error); // cycle detected
 * }
 * ```
 */

import type { Task, Plan } from '../schemas.js';
import type { Contract } from '../schemas.js';

export interface DagResult {
  /** Tasks with updated wave assignments */
  tasks: Task[];
  /** Total number of waves */
  totalWaves: number;
  /** Tasks per wave (wave number → task IDs) */
  waveMap: Record<number, string[]>;
  /** True if the dependency graph is acyclic */
  isValid: boolean;
  /** Error message if graph has cycles */
  error?: string;
}

/**
 * Assign execution waves to plan tasks based on dependency analysis.
 *
 * Uses Kahn's algorithm (BFS-based topological sort) to group tasks
 * into parallel execution waves:
 *
 * 1. Build an adjacency list and in-degree map from explicit `depends_on` fields.
 * 2. Optionally enrich the graph with edges from confirmed cross-repo contracts
 *    (provider repo tasks must complete before consumer repo tasks).
 * 3. Process all nodes with in-degree 0 as Wave 1, reduce in-degrees for their
 *    dependents, and repeat for Wave 2, 3, etc.
 * 4. If any tasks remain unprocessed after the BFS, a dependency cycle exists.
 *
 * @param tasks - Array of tasks to assign waves to.
 * @param contracts - Optional array of contracts for implicit dependency enrichment.
 *                    Only `confirmed` contracts contribute edges to the graph.
 * @returns A {@link DagResult} with updated tasks, wave map, and validity status.
 */
export function assignWaves(
  tasks: Task[],
  contracts: Contract[] = []
): DagResult {
  if (tasks.length === 0) {
    return { tasks: [], totalWaves: 0, waveMap: {}, isValid: true };
  }

  const taskMap = new Map<string, Task>();
  const adjacency = new Map<string, Set<string>>(); // task → dependents
  const inDegree = new Map<string, number>();

  // Initialize
  for (const task of tasks) {
    taskMap.set(task.id, { ...task });
    adjacency.set(task.id, new Set());
    inDegree.set(task.id, 0);
  }

  // Build graph from explicit depends_on
  for (const task of tasks) {
    for (const depId of task.depends_on) {
      if (!taskMap.has(depId)) {
        // Dependency references unknown task — skip silently
        continue;
      }
      // depId → task.id (depId must finish before task)
      adjacency.get(depId)!.add(task.id);
      inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
    }
  }

  // Enrich with contract-based implicit dependencies:
  // If task A is in a provider repo and task B is in a consumer repo,
  // and there's a confirmed contract between them, add A → B edge
  if (contracts.length > 0) {
    const confirmedContracts = contracts.filter((c) => c.confirmed);

    for (const taskA of tasks) {
      for (const taskB of tasks) {
        if (taskA.id === taskB.id) continue;

        // Check if there's a contract where A's repo provides to B's repo
        const hasContract = confirmedContracts.some(
          (c) =>
            c.provider === taskA.repo &&
            c.consumer === taskB.repo
        );

        if (hasContract) {
          // Only add edge if not already present (explicit deps take precedence)
          if (!adjacency.get(taskA.id)!.has(taskB.id)) {
            adjacency.get(taskA.id)!.add(taskB.id);
            inDegree.set(taskB.id, (inDegree.get(taskB.id) ?? 0) + 1);
          }
        }
      }
    }
  }

  // Kahn's algorithm: process in waves
  const waveMap: Record<number, string[]> = {};
  let currentWave = 1;
  let processed = 0;

  // Start with all nodes that have in-degree 0
  let queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    waveMap[currentWave] = [...queue];

    // Assign wave to all tasks in this batch
    for (const id of queue) {
      const task = taskMap.get(id)!;
      task.wave = currentWave;
      processed++;
    }

    // Find next batch: reduce in-degree for dependents
    const nextQueue: string[] = [];
    for (const id of queue) {
      for (const dependent of adjacency.get(id)!) {
        const newDegree = (inDegree.get(dependent) ?? 1) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          nextQueue.push(dependent);
        }
      }
    }

    queue = nextQueue;
    if (queue.length > 0) {
      currentWave++;
    }
  }

  // Cycle detection: if not all tasks were processed, there's a cycle
  if (processed < tasks.length) {
    const cycleNodes = tasks
      .filter((t) => (inDegree.get(t.id) ?? 0) > 0)
      .map((t) => t.id);

    return {
      tasks: [...taskMap.values()],
      totalWaves: currentWave,
      waveMap,
      isValid: false,
      error: `Dependency cycle detected involving tasks: ${cycleNodes.join(', ')}`,
    };
  }

  return {
    tasks: [...taskMap.values()],
    totalWaves: currentWave,
    waveMap,
    isValid: true,
  };
}
