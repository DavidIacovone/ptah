/**
 * Ptah CLI — Meta-orchestration framework
 *
 * Thin CLI entrypoint that routes subcommands to their handlers.
 * Heavy orchestration is delegated to skill files (ptah:<command>).
 */

const args = process.argv.slice(2);
const command = args[0];

async function main(): Promise<void> {
  switch (command) {
    case 'init': {
      const { runInit } = await import('./commands/init.js');
      await runInit(args.slice(1));
      break;
    }

    case 'list': {
      const { runList } = await import('./commands/list.js');
      await runList(args.slice(1));
      break;
    }

    case 'help':
    case '--help':
    case '-h':
    case undefined: {
      printHelp();
      break;
    }

    case '--version':
    case '-v': {
      await printVersion();
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      console.error(`Run "ptah help" for available commands.`);
      process.exit(1);
    }
  }
}

function printHelp(): void {
  console.log(`
ptah — Meta-orchestration framework for cross-repository AI coordination

USAGE
  ptah <command> [options]

COMMANDS
  init              Initialize a new Ptah project
  list              List all configured projects
  help              Show this help message

OPTIONS
  -v, --version     Show version number
  -h, --help        Show this help message

SKILL COMMANDS (run within AI tools)
  ptah:init         Interactive project initialization
  ptah:help         Show skill command reference
  ptah:status       Show project ecosystem status
`);
}

async function printVersion(): Promise<void> {
  try {
    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkgPath = join(__dirname, '..', 'package.json');

    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
    console.log(`ptah v${pkg.version}`);
  } catch {
    console.log('ptah v0.1.0');
  }
}

main().catch((err: Error) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
