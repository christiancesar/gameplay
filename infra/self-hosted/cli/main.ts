// Entry point of the npm run self-hosted:* scripts: node infra/self-hosted/cli/main.ts <command> [mode]
import { HostError } from './shell.ts'

// Loaded on demand: only start needs the built @gameplay/env package.
const commands: Record<string, (argument: string | undefined) => Promise<void>> = {
  start: async (mode) => (await import('./commands/start.ts')).start(mode),
  stop: async () => (await import('./commands/stop.ts')).stop(),
  logs: async () => (await import('./commands/logs.ts')).logs(),
}

const [name = '', argument] = process.argv.slice(2)
const command = commands[name]

try {
  if (!command) throw new HostError(`unknown command '${name}' (use ${Object.keys(commands).join(', ')})`)
  await command(argument)
} catch (error) {
  if (!(error instanceof HostError)) throw error
  console.error(`error: ${error.message}`)
  process.exitCode = 1
}
