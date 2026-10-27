import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fakeStream, fakeTrack } from '@/shared/media/test/media-fakes'

import { makeWatchSessionContext } from './test/watch-session-context'
import { inbound, makeCallMedia } from './test/screen-seed'

type Context = ReturnType<typeof makeWatchSessionContext>

const roster = (...live: string[]) => ({
  serverId: 's1',
  roomId: 'r1',
  participants: ['u1', 'u2', 'u3'].map((userId) => ({
    userId,
    muted: false,
    deafened: false,
    streaming: live.includes(userId) ? ('1080p60' as const) : null,
    streamMode: live.includes(userId) ? ('mesh' as const) : null,
  })),
})

describe('WatchSession', () => {
  let ctx: Context
  let media: ReturnType<typeof makeCallMedia>

  afterEach(() => vi.useRealTimers())
  beforeEach(() => {
    ctx = makeWatchSessionContext()
    media = makeCallMedia()
    ctx.source.emit(media)
  })

  it('asks the streamer and waits for the video', () => {
    ctx.session.watch('u2')
    expect(ctx.realtime.watchStream).toHaveBeenCalledWith('u2')
    expect(ctx.store.state).toMatchObject({ streamerId: 'u2', status: 'waiting', stream: null })
  })

  it('asks for nothing when there is no call', () => {
    ctx.source.emit(null)
    ctx.session.watch('u2')
    expect(ctx.realtime.watchStream).not.toHaveBeenCalled()
  })

  it('shows the video of the streamer and plays its audio apart from the voice', () => {
    ctx.session.watch('u2')
    const video = fakeTrack('video', 'v')
    const game = fakeTrack('audio', 'game')
    const stream = fakeStream([video, game])
    media.transport.emitTrack('u2', video, stream, 'screen')
    media.transport.emitTrack('u2', game, stream, 'screen')
    expect(ctx.store.state).toMatchObject({ status: 'playing', stream })
    expect(media.audio.addStream).toHaveBeenCalledWith('screen:u2', stream)
    expect(media.audio.setVolume).toHaveBeenCalledWith('screen:u2', 1)
  })

  it('measures what reaches me, and stops when I stop watching', async () => {
    vi.useFakeTimers()
    ctx.session.watch('u2')
    const video = fakeTrack('video', 'v')
    media.transport.emitTrack('u2', video, fakeStream([video]), 'screen')
    expect(ctx.store.state).toMatchObject({ quality: null, hasAudio: false })

    media.transport.connectionStats.u2 = [inbound({ trackIdentifier: 'v', frameHeight: 720, frameWidth: 1280 })]
    await vi.advanceTimersByTimeAsync(1000)
    expect(ctx.store.state.quality).toBeNull()
    media.transport.connectionStats.u2 = [
      inbound({ trackIdentifier: 'v', frameHeight: 720, frameWidth: 1280, bytesReceived: 250_000, timestamp: 2000 }),
    ]
    await vi.advanceTimersByTimeAsync(1000)
    expect(ctx.store.state.quality).toEqual({ width: 1280, height: 720, fps: 60, kbps: 2000 })

    ctx.session.stop()
    media.transport.getConnectionStats.mockClear()
    await vi.advanceTimersByTimeAsync(3000)
    expect(media.transport.getConnectionStats).not.toHaveBeenCalled()
    expect(ctx.store.state.quality).toBeNull()
  })

  it('tells whether the stream carries audio', () => {
    ctx.session.watch('u2')
    const video = fakeTrack('video', 'v')
    const game = fakeTrack('audio', 'game')
    media.transport.emitTrack('u2', video, fakeStream([video]), 'screen')
    expect(ctx.store.state.hasAudio).toBe(false)
    media.transport.emitTrack('u2', game, fakeStream([video, game]), 'screen')
    expect(ctx.store.state.hasAudio).toBe(true)
  })

  it('ignores the voice of the streamer and screens nobody asked for', () => {
    ctx.session.watch('u2')
    const voice = fakeTrack('audio')
    media.transport.emitTrack('u2', voice, fakeStream([voice]), 'voice')
    const other = fakeTrack('video')
    media.transport.emitTrack('u3', other, fakeStream([other]), 'screen')
    expect(ctx.store.state.status).toBe('waiting')
    expect(media.audio.addStream).not.toHaveBeenCalled()
  })

  it('has its own volume, from 0 to 100, kept after the view closes', () => {
    ctx.session.watch('u2')
    ctx.session.setVolume(40)
    expect(media.audio.setVolume).toHaveBeenLastCalledWith('screen:u2', 0.4)
    ctx.session.setVolume(250)
    expect(ctx.store.state.volume).toBe(100)
    ctx.session.setVolume(30)
    ctx.session.stop()
    expect(ctx.store.state).toMatchObject({ streamerId: null, status: 'idle', volume: 30 })
  })

  it('switching moves to the other screen: unwatches the first, then asks the second', () => {
    ctx.session.watch('u2')
    ctx.session.watch('u3')
    expect(ctx.realtime.unwatchStream).toHaveBeenCalledWith('u2')
    expect(media.audio.removeStream).toHaveBeenCalledWith('screen:u2')
    expect(ctx.realtime.watchStream).toHaveBeenLastCalledWith('u3')
    expect(ctx.store.state.streamerId).toBe('u3')
  })

  it('does not ask twice for the same screen', () => {
    ctx.session.watch('u2')
    ctx.session.watch('u2')
    expect(ctx.realtime.watchStream).toHaveBeenCalledTimes(1)
  })

  it('stopping tells the streamer and drops the audio', () => {
    ctx.session.watch('u2')
    ctx.session.stop()
    expect(ctx.realtime.unwatchStream).toHaveBeenCalledWith('u2')
    expect(media.audio.removeStream).toHaveBeenCalledWith('screen:u2')
  })

  it('closes when the streamer stops or leaves', () => {
    ctx.session.watch('u2')
    ctx.realtime.receive('room:participants', roster('u3'))
    expect(ctx.store.state.streamerId).toBeNull()
    expect(ctx.realtime.unwatchStream).toHaveBeenCalledWith('u2')
  })

  it('stays while the streamer is live, and ignores other rooms', () => {
    ctx.session.watch('u2')
    ctx.realtime.receive('room:participants', roster('u2'))
    ctx.realtime.receive('room:participants', { ...roster(), roomId: 'other' })
    expect(ctx.store.state.streamerId).toBe('u2')
  })

  it('flags a refused request and closes the view', async () => {
    ctx.realtime.watchError = new Error('NOT_STREAMING')
    ctx.session.watch('u2')
    await Promise.resolve()
    await Promise.resolve()
    expect(ctx.store.state).toMatchObject({ streamerId: null, failed: true })
    ctx.session.dismissFailure()
    expect(ctx.store.state.failed).toBe(false)
  })

  it('asks again when the connection to the streamer comes back', () => {
    ctx.session.watch('u2')
    media.transport.emitStatus('u2', 'connected')
    expect(ctx.realtime.watchStream).toHaveBeenCalledTimes(1)
    media.transport.emitStatus('u2', 'failed')
    media.transport.emitStatus('u2', 'connected')
    expect(ctx.realtime.watchStream).toHaveBeenCalledTimes(2)
  })

  it('closes with the call, without telling a room it left', () => {
    ctx.session.watch('u2')
    ctx.source.emit(null)
    expect(ctx.store.state.streamerId).toBeNull()
    expect(ctx.realtime.unwatchStream).not.toHaveBeenCalled()
    expect(ctx.realtime.listenerCount).toBe(0)
  })

  it('detach stops following', () => {
    ctx.session.detach()
    expect(ctx.source.listenerCount).toBe(0)
  })

  describe('through the SFU', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      ctx.modes.u2 = 'sfu'
    })

    it('pulls the screen from the SFU and still tells the streamer', async () => {
      ctx.session.watch('u2')
      await vi.advanceTimersByTimeAsync(0)
      const video = fakeTrack('video', 'v')
      const game = fakeTrack('audio', 'game')
      ctx.sfu.deliver({ track: video, streams: [] })
      ctx.sfu.deliver({ track: game, streams: [] })

      expect(ctx.watchFromSfu).toHaveBeenCalledWith('u2', 'f', expect.any(Function))
      expect(ctx.realtime.watchStream).toHaveBeenCalledWith('u2')
      expect(ctx.store.state).toMatchObject({ status: 'playing', hasAudio: true })
      expect(media.audio.addStream).toHaveBeenCalledWith('screen:u2', expect.anything())
    })

    it('measures what reaches me on the SFU connection', async () => {
      ctx.session.watch('u2')
      await vi.advanceTimersByTimeAsync(0)
      ctx.sfu.deliver({ track: fakeTrack('video', 'v'), streams: [] })
      ctx.sfu.stats = [inbound({ trackIdentifier: 'v', bytesReceived: 0, timestamp: 1000 })]
      await vi.advanceTimersByTimeAsync(1000)
      ctx.sfu.stats = [inbound({ trackIdentifier: 'v', bytesReceived: 500_000, timestamp: 2000 })]
      await vi.advanceTimersByTimeAsync(1000)

      expect(ctx.store.state.quality).toMatchObject({ kbps: 4000 })
    })

    it('closes the SFU connection when I stop watching', async () => {
      ctx.session.watch('u2')
      await vi.advanceTimersByTimeAsync(0)
      ctx.session.stop()
      expect(ctx.sfu.close).toHaveBeenCalled()
    })

    it('fails the view when the SFU refuses', async () => {
      ctx.sfu.failing = true
      ctx.session.watch('u2')
      await vi.advanceTimersByTimeAsync(0)
      expect(ctx.store.state).toMatchObject({ failed: true, streamerId: null })
    })
  })

  describe('quality I ask for', () => {
    beforeEach(() => vi.useFakeTimers())

    it('asks a Direct streamer for less, now and for the next stream', async () => {
      ctx.session.setLevel('low')
      ctx.session.watch('u2')
      await vi.advanceTimersByTimeAsync(0)
      expect(ctx.realtime.sendStreamQuality).toHaveBeenCalledWith('u2', 'low')

      ctx.session.setLevel('auto')
      expect(ctx.realtime.sendStreamQuality).toHaveBeenLastCalledWith('u2', 'auto')
      ctx.session.stop()
      expect(ctx.store.state.level).toBe('auto')
    })

    it('switches the SFU layer, and starts on the layer chosen before', async () => {
      ctx.modes.u2 = 'sfu'
      ctx.session.setLevel('medium')
      ctx.session.watch('u2')
      await vi.advanceTimersByTimeAsync(0)
      expect(ctx.watchFromSfu).toHaveBeenCalledWith('u2', 'h', expect.any(Function))

      ctx.session.setLevel('low')
      expect(ctx.sfu.setLayer).toHaveBeenCalledWith('q')
      expect(ctx.realtime.sendStreamQuality).not.toHaveBeenCalled()
    })

    it('reports the bytes received from the SFU since the last report, with the quality', async () => {
      ctx.modes.u2 = 'sfu'
      ctx.session.watch('u2')
      await vi.advanceTimersByTimeAsync(0)
      ctx.sfu.stats = [
        inbound({ bytesReceived: 4_000_000 }),
        { type: 'inbound-rtp', kind: 'audio', bytesReceived: 100_000 },
      ]
      await vi.advanceTimersByTimeAsync(10_000)
      ctx.sfu.stats = [
        inbound({ bytesReceived: 9_000_000 }),
        { type: 'inbound-rtp', kind: 'audio', bytesReceived: 200_000 },
      ]
      await vi.advanceTimersByTimeAsync(10_000)

      expect(ctx.realtime.reportMediaUsage.mock.calls.map(([usage]) => (usage as { bytes: number }).bytes)).toEqual([
        4_100_000, 5_100_000,
      ])
      ctx.session.stop()
      await vi.advanceTimersByTimeAsync(10_000)
      expect(ctx.realtime.reportMediaUsage).toHaveBeenCalledTimes(2)
    })
  })
})
