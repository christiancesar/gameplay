import { spawnSync } from 'node:child_process'

/** An expected failure: main prints the message, without a stack trace. */
export class HostError extends Error {}

type RunOptions = {
  cwd?: string
  /** Added to the current environment. */
  env?: Record<string, string>
  /** Message of the HostError thrown when the command fails. */
  failure?: string
}

/** Runs a command attached to the terminal and throws when it fails. */
export function run(command: string, args: string[], { cwd, env, failure }: RunOptions = {}): void {
  const result = spawnSync(command, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' })
  if (result.error || result.status !== 0) {
    throw new HostError(failure ?? `${command} ${args.join(' ')} failed`)
  }
}

/** Runs a command and returns what it printed; '' when it fails. */
export function output(command: string, args: string[], { cwd, env }: RunOptions = {}): string {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  return result.status === 0 ? result.stdout : ''
}

export function hasCommand(name: string): boolean {
  return spawnSync(name, ['--version'], { stdio: 'ignore' }).error === undefined
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
