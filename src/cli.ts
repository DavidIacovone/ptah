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

    case 'register': {
      const { runRegister } = await import('./commands/register.js');
      await runRegister(args.slice(1));
      break;
    }

    case 'learn':
    case 'ptah:learn': {
      const { runLearn } = await import('./commands/learn.js');
      await runLearn(args.slice(1));
      break;
    }

    case 'discover':
    case 'ptah:discover': {
      const { runDiscover } = await import('./commands/discover.js');
      await runDiscover(args.slice(1));
      break;
    }

    case 'plan':
    case 'ptah:plan': {
      const { runPlan } = await import('./commands/plan.js');
      await runPlan(args.slice(1));
      break;
    }

    case 'build-dag':
    case 'ptah:build-dag': {
      const { runBuildDag } = await import('./commands/build-dag.js');
      await runBuildDag(args.slice(1));
      break;
    }

    // ── Execution commands ──────────────────────────────────

    case 'next-task': {
      const { runNextTask } = await import('./commands/execute.js');
      await runNextTask(args.slice(1));
      break;
    }

    case 'complete-task': {
      const { runCompleteTask } = await import('./commands/execute.js');
      await runCompleteTask(args.slice(1));
      break;
    }

    case 'fail-task': {
      const { runFailTask } = await import('./commands/execute.js');
      await runFailTask(args.slice(1));
      break;
    }

    case 'status': {
      const { runStatus } = await import('./commands/status.js');
      await runStatus(args.slice(1));
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
  register          Register a repository with a project
  learn             Scan registered repositories
  discover          Discover cross-repo contracts
  plan              Create a task plan for cross-repo changes
  build-dag         Assign dependency-aware waves to plan tasks
  status            Show project lifecycle and execution progress
  next-task         Get the next pending task (JSON output)
  complete-task     Mark a task as completed and collect diff
  fail-task         Mark a task as failed with error message
  help              Show this help message

OPTIONS
  -v, --version     Show version number
  -h, --help        Show this help message

SKILL COMMANDS (run within AI tools)
  ptah:init         Interactive project setup guide
  ptah:help         Show skill command reference
  ptah:status       Show workspace status
  ptah:execute      Execute an approved plan via native subagents
  ptah:verify       Verify completed work against acceptance criteria
  ptah:register     Register a repository
  ptah:plan         Generate task plans from natural language
  ptah:build-dag    Auto-assign waves via dependency analysis
  ptah:learn        Scan ecosystem structure
  ptah:discover     Discover cross-repo contracts
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
