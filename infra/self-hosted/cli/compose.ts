import { existsSync } from 'node:fs'
import type { TunnelMode } from '@gameplay/env'
import { ENV_PATHS, HOST_DIR } from './paths.ts'
import { output, run } from './shell.ts'

// A type-only import: stop and logs run without building @gameplay/env.
const TUNNEL_PROFILES = ['quick', 'named', 'token'] as const satisfies readonly TunnelMode[]

/** Every tunnel profile, so a command also reaches the cloudflared containers. */
export const ALL_PROFILES = TUNNEL_PROFILES.flatMap((mode) => ['--profile', mode])

/** Every env file that exists feeds the ${VAR} interpolation of the compose file, as one. */
function envFileArgs(): string[] {
  return Object.values(ENV_PATHS)
    .filter((path) => existsSync(path))
    .flatMap((path) => ['--env-file', path])
}

function composeArgs(args: string[]): string[] {
  return ['compose', '--project-directory', HOST_DIR, '-f', `${HOST_DIR}/docker-compose.yml`, ...envFileArgs(), ...args]
}

// Builds on the local Docker engine ("default" builder), whatever builder is
// selected for other projects: a docker-container builder skipped the native
// optional packages (rolldown, sharp) of the alpine images.
const builder = () => ({ BUILDX_BUILDER: process.env.BUILDX_BUILDER ?? 'default' })

/** docker compose on the self-hosted project, attached to the terminal. */
export function compose(args: string[], options: { env?: Record<string, string>; failure?: string } = {}): void {
  run('docker', composeArgs(args), { ...options, env: { ...builder(), ...options.env } })
}

/** docker compose on the self-hosted project, returning what it printed. */
export function composeOutput(args: string[]): string {
  return output('docker', composeArgs(args), { env: builder() })
}
