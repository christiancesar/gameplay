import { existsSync } from 'node:fs'
import { type SelfHostedEnv, TUNNEL_MODES, type TunnelMode } from '@gameplay/env'
import { compose, composeOutput } from '../compose.ts'
import { migrateDatabase, seedAdmin } from '../database.ts'
import type { EnvFile } from '../env-file.ts'
import { waitForHealth } from '../health.ts'
import { ENV_EXAMPLE_FILE, ENV_FILE, HOST_DIR } from '../paths.ts'
import { sentryEnvelopeUrl } from '../sentry.ts'
import { prepareEnv, validateEnv } from '../setup-env.ts'
import { hasCommand, HostError, output } from '../shell.ts'
import { discoverQuickUrl } from '../tunnel.ts'

function checkTools(): void {
  for (const tool of ['docker', 'npx']) {
    if (!hasCommand(tool)) throw new HostError(`${tool} is required`)
  }
  if (!output('docker', ['compose', 'version'])) throw new HostError('docker compose v2 is required')
}

/** The mode passed to the command wins over TUNNEL_MODE, and is saved for the next start. */
function applyMode(requested: string | undefined, env: EnvFile): void {
  if (!requested) return
  if (!TUNNEL_MODES.includes(requested as TunnelMode)) {
    throw new HostError(`unknown mode '${requested}' (use ${TUNNEL_MODES.join(', ')})`)
  }
  env.set('TUNNEL_MODE', requested)
}

/** Quick mode: starts the tunnel first, since the build needs the URL it gets. */
async function quickTunnelUrl(config: SelfHostedEnv): Promise<string> {
  console.log('Starting database and quick tunnel...')
  compose(['up', '-d', '--wait', 'postgres'])
  compose(['--profile', 'quick', 'up', '-d', 'cloudflared-quick'])
  return discoverQuickUrl(String(config.CLOUDFLARED_METRICS_PORT))
}

/** named and token modes: a fixed hostname, already required by the schema. */
function fixedTunnelUrl(config: SelfHostedEnv, env: EnvFile): string {
  const appUrl = config.APP_URL ?? ''
  if (config.TUNNEL_MODE === 'named') {
    const credentials = config.CLOUDFLARE_TUNNEL_CREDENTIALS ?? ''
    if (!existsSync(credentials)) {
      throw new HostError(
        `CLOUDFLARE_TUNNEL_CREDENTIALS must be the path of the tunnel credentials JSON (got '${credentials}')`,
      )
    }
    // The ingress rule needs the bare hostname; the credentials file is usually
    // readable only by its owner, so the container runs as this user.
    env.set('PUBLIC_HOSTNAME', new URL(appUrl).hostname)
    env.set('CLOUDFLARED_UID', String(process.getuid?.() ?? 1000))
  }
  return appUrl
}

/** Where people open the app: this machine, or the URL of the chosen tunnel. */
async function appUrlFor(config: SelfHostedEnv, env: EnvFile): Promise<string> {
  switch (config.TUNNEL_MODE) {
    // localhost is a secure context, so voice and screen share work over plain http.
    case 'local':
      return `http://localhost:${config.WEB_PORT}`
    case 'quick':
      return quickTunnelUrl(config)
    default:
      return fixedTunnelUrl(config, env)
  }
}

/**
 * Build inputs that are not plain .env interpolation: the commit names the
 * Sentry release, and the token goes in as a build secret (empty: no upload).
 */
function buildEnv(config: SelfHostedEnv): Record<string, string> {
  return {
    GAMEPLAY_RELEASE: output('git', ['-C', HOST_DIR, 'rev-parse', '--short', 'HEAD']).trim(),
    SENTRY_AUTH_TOKEN: config.SENTRY_AUTH_TOKEN ?? '',
    SENTRY_ENVELOPE_URL: sentryEnvelopeUrl(config.VITE_SENTRY_DSN ?? ''),
  }
}

function printSummary(config: SelfHostedEnv, appUrl: string, generatedAdminPassword: string | null): void {
  const access =
    config.TUNNEL_MODE === 'local'
      ? [`  Open:  ${appUrl}  (this machine only; use a tunnel mode to share it)`]
      : [`  Link to share:  ${appUrl}`, `  Local access:   http://127.0.0.1:${config.WEB_PORT}`]
  const lines = [
    '',
    'Gameplay is up.',
    '',
    ...access,
    '',
    `Admin account: ${config.ADMIN_EMAIL} (username ${config.ADMIN_USERNAME})`,
    generatedAdminPassword
      ? `  Generated password (shown only now, also saved in ${ENV_FILE}): ${generatedAdminPassword}`
      : `  Password: ADMIN_PASSWORD in ${ENV_FILE}`,
    '',
    'Inviting people (sign-up needs a registration key):',
    `  1. Sign in as admin at ${appUrl} and enable 2FA at ${appUrl}/admin/setup.`,
    `  2. Create keys at ${appUrl}/admin/keys and send each friend the link plus a key.`,
  ]
  if (config.TUNNEL_MODE === 'quick') {
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
 *   npm run host:start              mode from .env (TUNNEL_MODE, local by default)
 *   npm run host:start -- local     this machine only, http://localhost, no tunnel
 *   npm run host:start -- quick     temporary *.trycloudflare.com URL, no account
 *   npm run host:start -- named     fixed hostname, tunnel credentials file
 *   npm run host:start -- token     fixed hostname, tunnel token from the dashboard
 */
export async function start(requestedMode: string | undefined): Promise<void> {
  checkTools()
  const { env, generatedAdminPassword } = prepareEnv(ENV_FILE, ENV_EXAMPLE_FILE)
  applyMode(requestedMode, env)
  // Stops here, before any build, when something only you can provide is missing.
  const config = validateEnv(env)
  env.set('TUNNEL_MODE', config.TUNNEL_MODE)

  // At most one tunnel: drop the other modes' containers if they are around.
  for (const other of TUNNEL_MODES.filter((mode) => mode !== config.TUNNEL_MODE && mode !== 'local')) {
    composeOutput(['--profile', other, 'rm', '-sf', `cloudflared-${other}`])
  }

  const appUrl = (await appUrlFor(config, env)).replace(/\/+$/, '')
  env.set('APP_URL', appUrl)

  console.log('Applying the database migrations...')
  compose(['up', '-d', '--wait', 'postgres'])
  migrateDatabase(config)

  console.log(`Building and starting the stack for ${appUrl} ...`)
  // local has no tunnel container, so no profile.
  const profile = config.TUNNEL_MODE === 'local' ? [] : ['--profile', config.TUNNEL_MODE]
  compose([...profile, 'up', '-d', '--build', '--remove-orphans', '--wait'], { env: buildEnv(config) })
  seedAdmin(config)

  console.log(`Waiting for ${appUrl}/api/health ...`)
  if (!(await waitForHealth(appUrl))) {
    compose(['ps'])
    throw new HostError("the public URL did not answer; check 'npm run host:logs'")
  }
  printSummary(config, appUrl, generatedAdminPassword)
}
