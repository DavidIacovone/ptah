# Pitfalls Research

**Domain:** Skill-based meta-orchestration / multi-repo AI coding coordination
**Researched:** 2026-04-03 | **Updated:** 2026-04-06 (npx install, multi-project model)
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Skill Instruction Drift

**What goes wrong:**
AI tool doesn't follow skill instructions precisely — skips steps, reinterprets instructions, or takes shortcuts. Multi-step workflows lose coherence across wave execution.

**Why it happens:**
AI tools are approximate instruction followers. Long, complex skill files get partially followed. Ambiguous instructions get reinterpreted.

**How to avoid:**
- Keep skill instructions short and explicit (numbered steps)
- Use clear state checkpoints ("Read STATE.json. If lifecycle != 'planned', STOP.")
- Put complex logic in helper scripts, not skill Markdown
- Design for resumability — if AI deviates, user can re-invoke skill and it picks up from state files

**Warning signs:**
- AI skipping steps in skill files
- AI making changes without reading state first
- Results inconsistent across sessions

**Phase to address:**
Phase 1 (skill foundation) — establish instruction patterns early

---

### Pitfall 2: Cross-Repo Navigation Confusion

**What goes wrong:**
AI tool loses track of which repo it's working in. Makes changes in the wrong repo, reads wrong files, or gets confused about relative paths when jumping between repos.

**Why it happens:**
AI tools are optimized for single-repo work. Switching between `./frontend/src/api.ts` and `../backend/src/routes.ts` requires explicit context management.

**How to avoid:**
- Skill instructions must explicitly state "Navigate to [repo path]" before each task
- Use absolute paths stored in project `repos/` profiles
- After each repo switch, verify location ("Confirm you are in: /path/to/repo")
- Task files include full repo path, not relative references

**Warning signs:**
- Changes appearing in wrong repo
- AI confused about "which repo am I in?"
- Path errors in git operations

**Phase to address:**
Phase 3 (execution) — execution skills must enforce explicit repo navigation

---

### Pitfall 3: State File Corruption / Drift

**What goes wrong:**
Per-project state files get out of sync with actual repo state. Ptah thinks a task completed when it didn't, or references contracts that no longer exist.

**Why it happens:**
State is file-based. If execution is interrupted (user stops AI, session crashes), state may be partially updated. Or repos change outside Ptah (manual commits, CI, other tools).

**How to avoid:**
- State updates should be atomic — update all related fields together
- Skill instructions: "Update STATE.json ONLY after confirming task completion"
- Include `ptah:status` command that validates state against git reality
- Design state as recoverable — can rebuild from git history

**Warning signs:**
- STATE.json claiming 3/5 tasks complete but repo shows uncommitted changes
- `ptah:status` showing stale information
- Duplicate task execution

**Phase to address:**
Phase 1 (foundation) — state management patterns established early

---

### Pitfall 4: Contract Discovery False Positives

**What goes wrong:**
Auto-discovery reports contracts that aren't real cross-repo dependencies (internal utilities matching API patterns, test fixtures, deprecated code). User confirmation fatigue leads to rubber-stamping.

**Why it happens:**
Pattern-matching heuristics are imprecise. An exported function isn't necessarily a cross-repo contract.

**How to avoid:**
- Validate discovered contracts by checking if they're actually imported in other repos
- Rank confidence: "imported by 3 repos" > "exported but unused externally"
- Present discoveries in batches with confidence scores
- Allow easy dismissal/correction

**Warning signs:**
- Contract registry growing to hundreds of entries
- Users skipping confirmation ("yes to all")
- Plans referencing contracts that don't affect the target repos

**Phase to address:**
Phase 2 (ecosystem learning) — discovery algorithm must have confidence filtering

---

### Pitfall 5: Cross-Repo Dependency Misordering

**What goes wrong:**
AI executes tasks in wrong order — modifies consumer before updating provider. Results: broken builds, type errors.

**Why it happens:**
Dependency analysis is hard across repo boundaries. AI may not faithfully follow wave ordering from plan.

**How to avoid:**
- DAG builder (helper script) enforces strict ordering — computationally, not via AI judgment
- Plan explicitly numbers waves and assigns tasks
- Skill instructions: "Execute ALL Wave 1 tasks before starting Wave 2"
- Each wave includes verification step before proceeding

**Warning signs:**
- Tests failing in consumer repos after execution
- AI executing Wave 2 tasks before Wave 1 is complete
- Task plans missing cross-repo dependency declarations

**Phase to address:**
Phase 3 (planning + execution) — DAG builder enforces ordering

---

### Pitfall 6: Dual-Tool Divergence

**What goes wrong:**
Gemini CLI and Claude Code interpret the same skill files differently, producing inconsistent behavior. Or one tool gains features the other can't support, causing feature drift.

**Why it happens:**
Different AI tools have different capabilities, context window sizes, and instruction-following fidelity. Skill files optimized for one tool may not work well in the other.

**How to avoid:**
- Test skill files in both tools during development
- Keep skill instructions simple and directive (least common denominator)
- Put tool-specific adaptations in `integrations/` directory, not in core skills
- State format (per-project files) is tool-agnostic — only skill entry points differ

**Warning signs:**
- "Works in Claude Code but not Gemini CLI"
- Skill files growing tool-specific conditional instructions
- One tool getting features the other lacks

**Phase to address:**
Phase 1 (foundation) — establish shared skill patterns early, test in both tools

---

## Pitfalls REMOVED by Extension Model Pivot

These pitfalls from the original standalone CLI design are **no longer relevant**:

| Removed Pitfall | Why No Longer Relevant |
|-----------------|------------------------|
| Subprocess reliability hell | No subprocess management — AI tool IS the executor |
| Over-engineering model router | Deferred to v1.x; no immediate pressure to build |
| Adapter interface complexity | No adapters — skills run inside the AI tool directly |
| npm distribution/versioning | Ptah IS distributed via npm now, but as thin CLI — not the original heavy standalone CLI |
| CLI framework lock-in | No heavy CLI framework — minimal arg parsing for thin CLI |

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding repo paths in skills | Faster first skill | Breaks when workspace moves | Never — always read from project `repos/` |
| Skipping state validation | Simpler skill logic | Race conditions, stale state | Never — read STATE.json first |
| Inline logic in skill Markdown | Avoids creating helper script | AI misinterprets, inconsistent | Only for trivial operations (read file, write file) |
| Testing only in one AI tool | 2x faster development | Silent breakage in other tool | Only for prototyping — test both before release |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing secrets in `~/.ptah/` | Secrets readable by any process | Secrets in environment variables only. `~/.ptah/` excluded from backups |
| Task instructions including env vars | Secrets leak into AI context, potentially logged | Scrub environment variables from task context |
| Auto-committing to protected branches | Pushed to main, breaks CI | Permission gates: never auto-commit to main/master |
| `~/.ptah/` accessible to other users | Multi-user machine leaks workspace state | Set proper file permissions on `~/.ptah/` (700) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Skills with 50+ steps | AI loses track, user can't follow | Max 15-20 steps per skill. Decompose complex workflows into sub-skills |
| No progress indication | User thinks tool is lost in multi-repo work | Skill instructions include "Report: completing task X of Y in repo Z" |
| Requiring all repos registered before any work | Blocks users who want to start small | Progressive registration — work with 1 repo, add more as needed |
| No rollback story | Failed execution leaves repos in broken state | Skills work on branches. Roll back = delete branches |

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Skill instruction drift | LOW | Re-invoke skill — it reads state and resumes from last checkpoint |
| Cross-repo confusion | LOW | Verify repo paths, re-execute failed task with explicit navigation |
| State corruption | MEDIUM | Run `ptah:status` to detect drift, manually fix or rebuild from git |
| Contract false positives | LOW | Edit CONTRACTS.md, remove false entries, re-run `ptah:discover` |
| Dependency misordering | MEDIUM | Rollback branches, re-plan with corrected DAG |
| Dual-tool divergence | MEDIUM | Simplify skill instructions to work in both, add tool-specific notes |

## Sources

- GSD framework — skill instruction patterns, state management failure modes
- Claude Code SKILL.md patterns — instruction fidelity observations
- Multi-agent orchestration literature — coordination failures in distributed systems
- Node.js file system documentation — atomic file operations

---
*Pitfalls research for: Skill-based meta-orchestration*
*Updated: 2026-04-06 (npx install, multi-project model)*
