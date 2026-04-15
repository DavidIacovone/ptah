/**
 * @module commands/setup
 *
 * CLI handler for `ptah setup` — Install Ptah skills into the host AI tool.
 *
 * Copies Ptah skill files (SKILL.md) from the package's `skills/` directory
 * into the host AI tool's skills directory so they appear as `/ptah-*` commands.
 *
 * Supported targets:
 * - Gemini CLI:  `~/.gemini/antigravity/skills/`
 * - Claude Code: `~/.claude/skills/`
 */

import { existsSync, mkdirSync, cpSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_SKILLS_DIR = join(__dirname, '..', 'skills');

/** Known AI tool skill directories. */
const SKILL_TARGETS: Record<string, string> = {
  'gemini-cli': join(homedir(), '.gemini', 'antigravity', 'skills'),
  'claude-code': join(homedir(), '.claude', 'skills'),
};

/**
 * Entry point for the `ptah setup` CLI command.
 *
 * Copies all ptah skill folders from the installed package into the
 * host AI tool's skills directory, making ptah commands discoverable.
 *
 * @param args - CLI arguments (currently unused).
 */
export async function runSetup(args: string[]): Promise<void> {
  // Determine target tool
  let tool = 'gemini-cli';
  const toolIdx = args.indexOf('--tool');
  if (toolIdx !== -1 && args[toolIdx + 1]) {
    tool = args[toolIdx + 1];
  }

  const targetDir = SKILL_TARGETS[tool];
  if (!targetDir) {
    console.error(`Error: Unknown tool "${tool}". Supported: ${Object.keys(SKILL_TARGETS).join(', ')}`);
    process.exit(1);
  }

  // Verify source skills exist
  if (!existsSync(PACKAGE_SKILLS_DIR)) {
    console.error('Error: Skills directory not found in package. Reinstall ptah-cli.');
    process.exit(1);
  }

  const skillDirs = readdirSync(PACKAGE_SKILLS_DIR).filter((entry) => {
    const entryPath = join(PACKAGE_SKILLS_DIR, entry);
    return existsSync(join(entryPath, 'SKILL.md'));
  });

  if (skillDirs.length === 0) {
    console.error('Error: No skill files found in package.');
    process.exit(1);
  }

  // Ensure target directory exists
  mkdirSync(targetDir, { recursive: true });

  let installed = 0;
  let updated = 0;

  for (const skillDir of skillDirs) {
    const src = join(PACKAGE_SKILLS_DIR, skillDir);
    const dest = join(targetDir, skillDir);
    const existed = existsSync(dest);

    // Copy recursively, overwriting existing files
    cpSync(src, dest, { recursive: true, force: true });

    if (existed) {
      updated++;
    } else {
      installed++;
    }
  }

  const toolDisplayMap: Record<string, string> = {
    'gemini-cli': 'Gemini CLI',
    'claude-code': 'Claude Code',
  };
  const toolDisplay = toolDisplayMap[tool] || tool;
  const skillPrefix = tool === 'claude-code' ? 'ptah:' : '/ptah-';

  console.log(`
✓ Ptah skills installed for ${toolDisplay}

  Location: ${targetDir}
  Installed: ${installed} new skill(s)
  Updated: ${updated} existing skill(s)
  Total: ${skillDirs.length} skill(s)

  Skills available:
${skillDirs.map((s) => `    ${skillPrefix}${s.replace('ptah-', '')}`).join('\n')}

  Type ${skillPrefix}${skillDirs[0]?.replace('ptah-', '') || 'help'} in ${toolDisplay} to get started.
`);
}
