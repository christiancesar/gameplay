import { SfuFailedError } from '../errors/media.errors'
import { CloudflareSfuProvider } from './cloudflare.sfu-provider'

function fakeFetch(status: number, body: unknown) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))
}

function sut(doFetch: typeof fetch) {
  return new CloudflareSfuProvider({ appId: 'app-1', appToken: 'token-1', fetch: doFetch })
}

const offer = { type: 'offer' as const, sdp: 'v=0 offer' }
const answer = { type: 'answer' as const, sdp: 'v=0 answer' }

describe('CloudflareSfuProvider', () => {
  it('creates a session with the app token', async () => {
    const doFetch = fakeFetch(201, { sessionId: 'cf-session' })

    expect(await sut(doFetch).newSession()).toBe('cf-session')

    const [url, init] = doFetch.mock.calls[0]
    expect(url).toBe('https://rtc.live.cloudflare.com/v1/apps/app-1/sessions/new')
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer token-1')
  })

  it('publishes local tracks with the browser offer', async () => {
    const doFetch = fakeFetch(200, {
      sessionDescription: answer,
      requiresImmediateRenegotiation: false,
      tracks: [{ mid: '0', trackName: 'screen-video-0' }],
    })

    const result = await sut(doFetch).publish('cf-1', offer, [{ mid: '0', trackName: 'screen-video-0' }])

    const [url, init] = doFetch.mock.calls[0]
    expect(url).toBe('https://rtc.live.cloudflare.com/v1/apps/app-1/sessions/cf-1/tracks/new')
    expect(JSON.parse(init?.body as string)).toEqual({
      sessionDescription: offer,
      tracks: [{ location: 'local', mid: '0', trackName: 'screen-video-0' }],
    })
    expect(result).toEqual({
      sessionDescription: answer,
      requiresImmediateRenegotiation: false,
      tracks: [{ mid: '0', trackName: 'screen-video-0' }],
    })
  })

  it('pulls remote tracks, with simulcast only where a layer is given', async () => {
    const doFetch = fakeFetch(200, {
      sessionDescription: offer,
      requiresImmediateRenegotiation: true,
      tracks: [
        { mid: '5', sessionId: 'cf-1', trackName: 'screen-video-0' },
        { mid: '6', sessionId: 'cf-1', trackName: 'screen-audio-1' },
      ],
    })

    const result = await sut(doFetch).pull('cf-2', [
      { sessionId: 'cf-1', trackName: 'screen-video-0', layer: 'h' },
      { sessionId: 'cf-1', trackName: 'screen-audio-1' },
    ])

    expect(JSON.parse(doFetch.mock.calls[0][1]?.body as string)).toEqual({
      tracks: [
        {
          location: 'remote',
          sessionId: 'cf-1',
          trackName: 'screen-video-0',
          simulcast: { preferredRid: 'h', priorityOrdering: 'asciibetical', ridNotAvailable: 'asciibetical' },
        },
        { location: 'remote', sessionId: 'cf-1', trackName: 'screen-audio-1' },
      ],
    })
    expect(result.requiresImmediateRenegotiation).toBe(true)
    expect(result.tracks).toEqual([
      { mid: '5', trackName: 'screen-video-0' },
      { mid: '6', trackName: 'screen-audio-1' },
    ])
  })

  it('switches the layer on the same mid', async () => {
    const doFetch = fakeFetch(200, { requiresImmediateRenegotiation: false, tracks: [{ mid: '5' }] })

    await sut(doFetch).setLayer('cf-2', '5', { sessionId: 'cf-1', trackName: 'screen-video-0', layer: 'q' })

    const [url, init] = doFetch.mock.calls[0]
    expect(url).toBe('https://rtc.live.cloudflare.com/v1/apps/app-1/sessions/cf-2/tracks/update')
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(init?.body as string).tracks[0]).toMatchObject({ mid: '5', simulcast: { preferredRid: 'q' } })
  })

  it('closes with force when there is no offer', async () => {
    const doFetch = fakeFetch(200, { requiresImmediateRenegotiation: false, tracks: [{ mid: '0' }] })

    expect(await sut(doFetch).close('cf-1', ['0'])).toBeNull()

    expect(JSON.parse(doFetch.mock.calls[0][1]?.body as string)).toEqual({ tracks: [{ mid: '0' }], force: true })
  })

  it('fails on a refused request or a failed track', async () => {
    await expect(sut(fakeFetch(401, {})).newSession()).rejects.toBeInstanceOf(SfuFailedError)
    await expect(sut(fakeFetch(200, { errorCode: 'invalid_request' })).newSession()).rejects.toBeInstanceOf(
      SfuFailedError,
    )
    const trackFailed = fakeFetch(200, { tracks: [{ mid: '0', errorCode: 'internal_error' }] })
    await expect(sut(trackFailed).close('cf-1', ['0'])).rejects.toBeInstanceOf(SfuFailedError)
  })

  it('fails when Cloudflare does not answer', async () => {
    const doFetch = vi.fn<typeof fetch>(async () => {
      throw new Error('timeout')
    })

    await expect(sut(doFetch).newSession()).rejects.toBeInstanceOf(SfuFailedError)
  })
})
