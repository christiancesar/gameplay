import { z } from 'zod'
import { IceProvider, type IssuedIce } from '../ice.provider'

type Options = {
  keyId: string
  apiToken: string
  ttlSeconds: number
  // Injected by the tests.
  fetch?: typeof fetch
}

const responseSchema = z.object({
  iceServers: z.array(
    z.object({
      urls: z.union([z.string(), z.array(z.string())]),
      username: z.string().optional(),
      credential: z.string().optional(),
    }),
  ),
})

const API_URL = 'https://rtc.live.cloudflare.com/v1/turn/keys'

// Cloudflare Realtime TURN: short-lived credentials from its API. The API
// token stays on the server; only the generated credentials reach the web.
export class CloudflareIceProvider extends IceProvider {
  constructor(private readonly options: Options) {
    super()
  }

  async issue(): Promise<IssuedIce> {
    const { keyId, apiToken, ttlSeconds, fetch: doFetch = fetch } = this.options
    const response = await doFetch(`${API_URL}/${keyId}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ttl: ttlSeconds }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`Cloudflare TURN answered ${response.status}`)

    const { iceServers } = responseSchema.parse(await response.json())
    return {
      iceServers: iceServers
        .map((server) => ({ ...server, urls: withoutPort53([server.urls].flat()) }))
        .filter((server) => server.urls.length > 0),
      ttlSeconds,
    }
  }

  // One call per TURN username; Cloudflare answers 204.
  override async revoke(issued: IssuedIce): Promise<void> {
    const { keyId, apiToken, fetch: doFetch = fetch } = this.options
    const usernames = [...new Set(issued.iceServers.flatMap((server) => (server.username ? [server.username] : [])))]
    for (const username of usernames) {
      const response = await doFetch(`${API_URL}/${keyId}/credentials/${encodeURIComponent(username)}/revoke`, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiToken}` },
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) throw new Error(`Cloudflare TURN revoke answered ${response.status}`)
    }
  }
}

// Browsers block port 53, and those URLs only time out (Cloudflare docs).
function withoutPort53(urls: string[]): string[] {
  return urls.filter((url) => !/:53(\?|$)/.test(url))
}
