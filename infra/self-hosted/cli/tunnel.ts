import { composeOutput } from './compose.ts'
import { HostError, sleep } from './shell.ts'

/** Hostname in the body of cloudflared's /quicktunnel metrics endpoint. */
export function quickTunnelHostname(body: string): string | null {
  try {
    const { hostname } = JSON.parse(body) as { hostname?: unknown }
    return typeof hostname === 'string' && hostname ? hostname : null
  } catch {
    return null
  }
}

/** Last quick tunnel hostname printed in the cloudflared logs. */
export function hostnameInLogs(logs: string): string | null {
  return logs.match(/[a-z0-9-]+\.trycloudflare\.com/g)?.at(-1) ?? null
}

async function fetchText(url: string): Promise<string> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return response.ok ? await response.text() : ''
  } catch {
    return ''
  }
}

/** Waits for cloudflared to announce the quick tunnel and returns its https URL. */
export async function discoverQuickUrl(metricsPort: string): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const hostname =
      quickTunnelHostname(await fetchText(`http://127.0.0.1:${metricsPort}/quicktunnel`)) ??
      // Fallback: the URL is also printed in the cloudflared logs.
      hostnameInLogs(composeOutput(['--profile', 'quick', 'logs', 'cloudflared-quick']))
    if (hostname) return `https://${hostname}`
    await sleep(2000)
  }
  throw new HostError('could not read the quick tunnel URL (run npm run host:logs)')
}
