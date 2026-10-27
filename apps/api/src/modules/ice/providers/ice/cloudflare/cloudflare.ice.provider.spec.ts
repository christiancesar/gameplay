import { CloudflareIceProvider } from './cloudflare.ice.provider'

function fakeFetch(status: number, body: unknown) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
}

const cloudflareBody = {
  iceServers: [
    { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] },
    {
      urls: [
        'turn:turn.cloudflare.com:3478?transport=udp',
        'turn:turn.cloudflare.com:53?transport=udp',
        'turns:turn.cloudflare.com:443?transport=tcp',
      ],
      username: 'cf-user',
      credential: 'cf-pass',
    },
  ],
}

describe('CloudflareIceProvider', () => {
  it('asks for credentials with the token and the TTL', async () => {
    const doFetch = fakeFetch(201, cloudflareBody)
    const sut = new CloudflareIceProvider({ keyId: 'key-1', apiToken: 'token-1', ttlSeconds: 7200, fetch: doFetch })

    await sut.issue()

    const [url, init] = doFetch.mock.calls[0]
    expect(url).toBe('https://rtc.live.cloudflare.com/v1/turn/keys/key-1/credentials/generate-ice-servers')
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer token-1')
    expect(JSON.parse(init?.body as string)).toEqual({ ttl: 7200 })
  })

  it('returns the servers without the port 53 URLs', async () => {
    const sut = new CloudflareIceProvider({
      keyId: 'k',
      apiToken: 't',
      ttlSeconds: 7200,
      fetch: fakeFetch(201, cloudflareBody),
    })

    const issued = await sut.issue()

    expect(issued).toEqual({
      ttlSeconds: 7200,
      iceServers: [
        { urls: ['stun:stun.cloudflare.com:3478'] },
        {
          urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turns:turn.cloudflare.com:443?transport=tcp'],
          username: 'cf-user',
          credential: 'cf-pass',
        },
      ],
    })
  })

  it('accepts urls as a single string', async () => {
    const sut = new CloudflareIceProvider({
      keyId: 'k',
      apiToken: 't',
      ttlSeconds: 60,
      fetch: fakeFetch(201, { iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] }),
    })

    expect((await sut.issue()).iceServers).toEqual([{ urls: ['stun:stun.cloudflare.com:3478'] }])
  })

  it('fails when Cloudflare refuses', async () => {
    const sut = new CloudflareIceProvider({ keyId: 'k', apiToken: 't', ttlSeconds: 60, fetch: fakeFetch(401, {}) })

    await expect(sut.issue()).rejects.toThrow(/401/)
  })
})
