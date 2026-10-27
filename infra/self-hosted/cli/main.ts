// Entry point of the npm run host:* scripts: node infra/self-hosted/cli/main.ts <command> [mode]
import { logs } from './commands/logs.ts'
import { start } from './commands/start.ts'
import { stop } from './commands/stop.ts'
import { HostError } from './shell.ts'

const commands: Record<string, (argument: string | undefined) => void | Promise<void>> = {
  start,
  stop,
  logs,
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
