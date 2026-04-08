# Project Contracts: {{projectName}}

**Meta-orchestration repository contract map.**
*Generated: {{generatedAt}}*

This file identifies dependencies and API contracts between registered repositories. It serves as the source of truth for the Ptah planning engine to determine task ordering (waves).

## Contract Registry

| Provider | Consumer | Type | Confidence | Confirmed |
|----------|----------|------|------------|-----------|
{{contractRows}}

## Legend

- **Type**:
  - `npm dependency`: Explicitly listed in package.json/manifest.
  - `role match`: Heuristic match between consumer/provider roles.
  - `export match`: Heuristic match between consumer exports and provider name.
- **Confidence**: 0.0 to 1.0 (1.0 = highly certain).
- **Confirmed**: `✓` (user confirmed), `?` (auto-detected).

---
*To update this map, run `ptah discover --generate`.*
