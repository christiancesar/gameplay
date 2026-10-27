import { existsSync } from 'node:fs'
import { compose, composeOutput, TUNNEL_MODES, type TunnelMode } from '../compose.ts'
import { migrateDatabase, seedAdmin } from '../database.ts'
import type { EnvFile } from '../env-file.ts'
import { waitForHealth } from '../health.ts'
import { ENV_EXAMPLE_FILE, ENV_FILE, HOST_DIR } from '../paths.ts'
import { sentryEnvelopeUrl } from '../sentry.ts'
import { prepareEnv } from '../setup-env.ts'
import { hasCommand, HostError, output } from '../shell.ts'
import { discoverQuickUrl } from '../tunnel.ts'

function checkTools(): void {
  for (const tool of ['docker', 'npx']) {
    if (!hasCommand(tool)) throw new HostError(`${tool} is required`)
  }
  if (!output('docker', ['compose', 'version'])) throw new HostError('docker compose v2 is required')
}

function tunnelMode(requested: string | undefined, env: EnvFile): TunnelMode {
  const mode = requested || env.get('TUNNEL_MODE') || 'quick'
  if (!TUNNEL_MODES.includes(mode as TunnelMode)) {
    throw new HostError(`unknown mode '${mode}' (use ${TUNNEL_MODES.join(', ')})`)
  }
  return mode as TunnelMode
}

/** Quick mode: starts the tunnel first, since the build needs the URL it gets. */
async function quickTunnelUrl(env: EnvFile): Promise<string> {
  console.log('Starting database and quick tunnel...')
  compose(['up', '-d', '--wait', 'postgres'])
  compose(['--profile', 'quick', 'up', '-d', 'cloudflared-quick'])
  return discoverQuickUrl(env.get('CLOUDFLARED_METRICS_PORT') || '20241')
}

/** named and token modes: a fixed hostname, configured beforehand in .env. */
function fixedTunnelUrl(mode: 'named' | 'token', env: EnvFile): string {
  const appUrl = env.get('APP_URL')
  if (!appUrl) throw new HostError(`APP_URL is empty in ${ENV_FILE} (your tunnel hostname, https://...)`)
  if (mode === 'token') {
    if (!env.get('CLOUDFLARE_TUNNEL_TOKEN')) throw new HostError(`CLOUDFLARE_TUNNEL_TOKEN is empty in ${ENV_FILE}`)
    return appUrl
  }
  if (!env.get('CLOUDFLARE_TUNNEL_ID')) throw new HostError(`CLOUDFLARE_TUNNEL_ID is empty in ${ENV_FILE}`)
  const credentials = env.get('CLOUDFLARE_TUNNEL_CREDENTIALS')
  if (!existsSync(credentials)) {
    throw new HostError(
      `CLOUDFLARE_TUNNEL_CREDENTIALS must be the path of the tunnel credentials JSON (got '${credentials}')`,
    )
  }
  // The ingress rule needs the bare hostname; the credentials file is usually
  // readable only by its owner, so the container runs as this user.
  env.set('PUBLIC_HOSTNAME', new URL(appUrl).hostname)
  env.set('CLOUDFLARED_UID', String(process.getuid?.() ?? 1000))
  return appUrl
}

/**
 * Build inputs that are not plain .env interpolation: the commit names the
 * Sentry release, and the token goes in as a build secret (empty: no upload).
 */
function buildEnv(env: EnvFile): Record<string, string> {
  return {
    GAMEPLAY_RELEASE: output('git', ['-C', HOST_DIR, 'rev-parse', '--short', 'HEAD']).trim(),
    SENTRY_AUTH_TOKEN: env.get('SENTRY_AUTH_TOKEN'),
    SENTRY_ENVELOPE_URL: sentryEnvelopeUrl(env.get('VITE_SENTRY_DSN')),
  }
}

function printSummary(env: EnvFile, mode: TunnelMode, appUrl: string, generatedAdminPassword: string | null): void {
  const lines = [
    '',
    'Gameplay is up.',
    '',
    `  Link to share:  ${appUrl}`,
    `  Local access:   http://127.0.0.1:${env.get('WEB_PORT')}`,
    '',
    `Admin account: ${env.get('ADMIN_EMAIL')} (username ${env.get('ADMIN_USERNAME')})`,
    generatedAdminPassword
      ? `  Generated password (shown only now, also saved in ${ENV_FILE}): ${generatedAdminPassword}`
      : `  Password: ADMIN_PASSWORD in ${ENV_FILE}`,
    '',
    'Inviting friends (sign-up needs a registration key):',
    `  1. Sign in as admin at ${appUrl} and enable 2FA at ${appUrl}/admin/setup.`,
    `  2. Create keys at ${appUrl}/admin/keys and send each friend the link plus a key.`,
  ]
  if (mode === 'quick') {
    lines.push(
      '',
      'Quick mode: this URL changes on every restart. Sessions on the old URL stop',
      'working and friends need the new link. Use named mode for a fixed address.',
    )
  }
  lines.push('', 'Stop it when you are done: npm run host:stop')
  console.log(lines.join('\n'))
}

/**
 * Starts the stack and prints the link to share.
 *   npm run host:start              mode from .env (TUNNEL_MODE, quick by default)
 *   npm run host:start -- quick     temporary *.trycloudflare.com URL, no account
 *   npm run host:start -- named     fixed hostname, tunnel credentials file
 *   npm run host:start -- token     fixed hostname, tunnel token from the dashboard
 */
export async function start(requestedMode: string | undefined): Promise<void> {
  checkTools()
  const { env, generatedAdminPassword } = prepareEnv(ENV_FILE, ENV_EXAMPLE_FILE)

  const mode = tunnelMode(requestedMode, env)
  env.set('TUNNEL_MODE', mode)
  // Only one tunnel at a time: drop the other modes' containers if they are around.
  for (const other of TUNNEL_MODES.filter((candidate) => candidate !== mode)) {
    composeOutput(['--profile', other, 'rm', '-sf', `cloudflared-${other}`])
  }

  const tunnelUrl = mode === 'quick' ? await quickTunnelUrl(env) : fixedTunnelUrl(mode, env)
  const appUrl = tunnelUrl.replace(/\/+$/, '')
  env.set('APP_URL', appUrl)

  console.log('Applying the database migrations...')
  compose(['up', '-d', '--wait', 'postgres'])
  migrateDatabase(env)

  console.log(`Building and starting the stack for ${appUrl} ...`)
  compose(['--profile', mode, 'up', '-d', '--build', '--remove-orphans', '--wait'], { env: buildEnv(env) })
  seedAdmin(env)

  console.log(`Waiting for ${appUrl}/api/health ...`)
  if (!(await waitForHealth(appUrl))) {
    compose(['ps'])
    throw new HostError("the public URL did not answer; check 'npm run host:logs'")
  }
  printSummary(env, mode, appUrl, generatedAdminPassword)
}
