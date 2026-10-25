import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { makeShareSessionContext } from './test/share-session-context'
import { gameSettings, makeCallMedia, outbound, tabSettings } from './test/screen-seed'

type Context = ReturnType<typeof makeShareSessionContext>

describe('ShareSession', () => {
  let ctx: Context
  let media: ReturnType<typeof makeCallMedia>

  beforeEach(() => {
    vi.useFakeTimers()
    ctx = makeShareSessionContext()
    media = makeCallMedia()
    ctx.source.emit(media)
  })
  afterEach(() => vi.useRealTimers())

  const goLive = async (settings = gameSettings) => {
    await ctx.session.start(settings, 'smooth')
  }
  const viewerAsks = async (viewerId: string) => {
    ctx.realtime.receive('stream:watch-request', { viewerId })
    await vi.advanceTimersByTimeAsync(0)
  }

  describe('start', () => {
    it('opens the picker with the preset as constraints, then announces the stream', async () => {
      const pending = ctx.session.start(gameSettings, 'smooth')
      expect(ctx.store.state.status).toBe('picking')
      await pending
      expect(ctx.acquireScreen).toHaveBeenCalledTimes(1)
      const options = ctx.acquireScreen.mock.calls[0] as unknown as [DisplayMediaStreamOptions]
      expect(options[0].video).toMatchObject({ displaySurface: 'window', frameRate: { ideal: 60 } })
      expect(ctx.realtime.startStream).toHaveBeenCalledWith('1080p60')
      expect(ctx.store.state).toMatchObject({
        status: 'live',
        settings: gameSettings,
        source: { height: 1080, fps: 60 },
        preview: { stream: ctx.capture.stream, surface: 'unknown' },
      })
    })

    it('clears the preview when the share stops', async () => {
      await ctx.session.start(gameSettings, 'smooth')
      await ctx.session.stop()
      expect(ctx.store.state.preview).toBeNull()
    })

    it('hints the encoder by priority: motion for smooth, detail for sharp', async () => {
      await ctx.session.start(gameSettings, 'sharp')
      expect(ctx.capture.video.contentHint).toBe('detail')
      await ctx.session.stop()
      await ctx.session.start(gameSettings, 'smooth')
      expect(ctx.capture.video.contentHint).toBe('motion')
    })

    it('goes back to idle, quietly, when the user closes the picker', async () => {
      ctx.picker.answer = 'cancel'
      await goLive()
      expect(ctx.store.state).toMatchObject({ status: 'idle', notice: null })
      expect(ctx.realtime.startStream).not.toHaveBeenCalled()
    })

    it('says why when the browser cannot capture', async () => {
      ctx.picker.answer = 'unsupported'
      await goLive()
      expect(ctx.store.state).toMatchObject({ status: 'idle', notice: 'unsupported' })
      ctx.picker.answer = 'fail'
      await goLive()
      expect(ctx.store.state.notice).toBe('failed')
    })

    it('needs a call', async () => {
      ctx.source.emit(null)
      await goLive()
      expect(ctx.store.state).toMatchObject({ status: 'idle', notice: 'not-in-call' })
      expect(ctx.acquireScreen).not.toHaveBeenCalled()
    })

    it('does not start twice', async () => {
      await goLive()
      await goLive()
      expect(ctx.acquireScreen).toHaveBeenCalledTimes(1)
    })

    it('drops the capture when the call ended while the picker was open', async () => {
      const pending = ctx.session.start(gameSettings, 'smooth')
      ctx.source.emit(null)
      await pending
      expect(ctx.stopScreen).toHaveBeenCalledWith(ctx.capture)
      expect(ctx.store.state.status).toBe('idle')
      expect(ctx.realtime.startStream).not.toHaveBeenCalled()
    })

    it('gives up with a notice when the room cannot be told', async () => {
      ctx.realtime.startError = new Error('NOT_IN_ROOM')
      await goLive()
      expect(ctx.store.state).toMatchObject({ status: 'idle', notice: 'start-failed' })
      expect(ctx.stopScreen).toHaveBeenCalled()
    })
  })

  describe('viewers', () => {
    it('sends nothing until someone asks to watch', async () => {
      await goLive()
      expect(media.transport.addTrack).not.toHaveBeenCalled()
      expect(ctx.store.state.viewerIds).toEqual([])
    })

    it('sends video and game audio to who asked, with the encoder settings of the preset', async () => {
      await goLive()
      await viewerAsks('u2')
      expect(media.transport.addTrack.mock.calls).toEqual([
        ['u2', ctx.capture.video, ctx.capture.stream],
        ['u2', ctx.capture.audio, ctx.capture.stream],
      ])
      expect(media.transport.setVideoEncoding).toHaveBeenCalledWith('u2', ctx.capture.video, {
        maxBitrate: 8_000_000,
        maxFramerate: 60,
        degradationPreference: 'maintain-framerate',
      })
      expect(ctx.store.state.viewerIds).toEqual(['u2'])
    })

    it('sends only video when there is no audio', async () => {
      ctx.picker.withAudio = false
      await goLive(tabSettings)
      await viewerAsks('u2')
      expect(media.transport.addTrack).toHaveBeenCalledTimes(1)
    })

    it('counts a repeated request once', async () => {
      await goLive()
      await viewerAsks('u2')
      await viewerAsks('u2')
      expect(ctx.store.state.viewerIds).toEqual(['u2'])
    })

    it('takes the tracks back when the viewer stops watching', async () => {
      await goLive()
      await viewerAsks('u2')
      await viewerAsks('u3')
      ctx.realtime.receive('stream:unwatch', { viewerId: 'u2' })
      expect(media.transport.removeTrack.mock.calls).toEqual([
        ['u2', ctx.capture.video],
        ['u2', ctx.capture.audio],
      ])
      expect(ctx.store.state.viewerIds).toEqual(['u3'])
    })

    it('forgets viewers who left the room', async () => {
      await goLive()
      await viewerAsks('u2')
      await viewerAsks('u3')
      ctx.realtime.receive('room:participants', {
        serverId: 's1',
        roomId: 'r1',
        participants: [
          { userId: 'u1', muted: false, deafened: false, streaming: '1080p60' },
          { userId: 'u3', muted: false, deafened: false, streaming: null },
        ],
      })
      expect(ctx.store.state.viewerIds).toEqual(['u3'])
    })

    it('ignores the roster of another room', async () => {
      await goLive()
      await viewerAsks('u2')
      ctx.realtime.receive('room:participants', { serverId: 's1', roomId: 'other', participants: [] })
      expect(ctx.store.state.viewerIds).toEqual(['u2'])
    })

    it('ignores requests when it is not live', async () => {
      await viewerAsks('u2')
      expect(media.transport.addTrack).not.toHaveBeenCalled()
    })
  })

  describe('monitor', () => {
    it('measures every viewer from its own sender, once a second', async () => {
      await goLive()
      await viewerAsks('u2')
      await viewerAsks('u3')
      media.transport.stats = {
        u2: [outbound({ bytesSent: 0, timestamp: 1000 })],
        u3: [
          outbound({
            bytesSent: 0,
            timestamp: 1000,
            frameHeight: 720,
            framesPerSecond: 42,
            qualityLimitationReason: 'bandwidth',
          }),
        ],
      }
      await vi.advanceTimersByTimeAsync(1000)
      expect(ctx.store.state.stats).toEqual({})
      media.transport.stats = {
        u2: [outbound({ bytesSent: 1_000_000, timestamp: 2000 })],
        u3: [
          outbound({
            bytesSent: 250_000,
            timestamp: 2000,
            frameHeight: 720,
            framesPerSecond: 42,
            qualityLimitationReason: 'bandwidth',
          }),
        ],
      }
      await vi.advanceTimersByTimeAsync(1000)
      expect(ctx.store.state.stats.u2).toMatchObject({ height: 1080, fps: 60, kbps: 8000, limitation: 'none' })
      expect(ctx.store.state.stats.u3).toMatchObject({ height: 720, fps: 42, kbps: 2000, limitation: 'bandwidth' })
    })

    it('drops the measure of who stopped watching', async () => {
      await goLive()
      await viewerAsks('u2')
      media.transport.stats = { u2: [outbound({ timestamp: 1000 })] }
      await vi.advanceTimersByTimeAsync(1000)
      media.transport.stats = { u2: [outbound({ bytesSent: 10, timestamp: 2000 })] }
      await vi.advanceTimersByTimeAsync(1000)
      ctx.realtime.receive('stream:unwatch', { viewerId: 'u2' })
      expect(ctx.store.state.stats).toEqual({})
    })

    it('does not measure after stopping', async () => {
      await goLive()
      await viewerAsks('u2')
      await ctx.session.stop()
      media.transport.getSenderStats.mockClear()
      await vi.advanceTimersByTimeAsync(3000)
      expect(media.transport.getSenderStats).not.toHaveBeenCalled()
    })
  })

  describe('changing quality live', () => {
    it('applies the new preset to the capture and to every viewer, and tells the room', async () => {
      await goLive()
      await viewerAsks('u2')
      media.transport.setVideoEncoding.mockClear()
      await ctx.session.updateQuality({ ...gameSettings, resolution: '720p', fps: 30 }, 'smooth')
      expect(ctx.capture.video.applyConstraints).toHaveBeenCalledWith({
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      })
      expect(media.transport.setVideoEncoding).toHaveBeenCalledWith('u2', ctx.capture.video, {
        maxBitrate: 2_500_000,
        maxFramerate: 30,
        degradationPreference: 'maintain-framerate',
      })
      expect(ctx.realtime.startStream).toHaveBeenLastCalledWith('720p30')
      expect(ctx.store.state.settings).toMatchObject({ resolution: '720p', fps: 30 })
      expect(ctx.stopScreen).not.toHaveBeenCalled()
    })

    it('changing only the priority does not announce a new preset', async () => {
      await goLive()
      await viewerAsks('u2')
      ctx.realtime.startStream.mockClear()
      await ctx.session.updateQuality(gameSettings, 'sharp')
      expect(ctx.capture.video.contentHint).toBe('detail')
      expect(media.transport.setVideoEncoding).toHaveBeenLastCalledWith(
        'u2',
        ctx.capture.video,
        expect.objectContaining({ degradationPreference: 'maintain-resolution' }),
      )
      expect(ctx.realtime.startStream).not.toHaveBeenCalled()
    })

    it('keeps going when the capture refuses the new size', async () => {
      await goLive()
      ctx.capture.video.applyConstraints.mockRejectedValueOnce(new Error('Overconstrained'))
      await ctx.session.updateQuality({ ...gameSettings, fps: 30 }, 'smooth')
      expect(ctx.realtime.startStream).toHaveBeenLastCalledWith('1080p30')
    })

    it('does nothing when not live', async () => {
      await ctx.session.updateQuality(gameSettings, 'smooth')
      expect(ctx.realtime.startStream).not.toHaveBeenCalled()
    })
  })

  describe('stopping', () => {
    it('stops from the panel: takes the tracks back, ends the capture and tells the room', async () => {
      await goLive()
      await viewerAsks('u2')
      await ctx.session.stop()
      expect(media.transport.removeTrack).toHaveBeenCalledWith('u2', ctx.capture.video)
      expect(ctx.stopScreen).toHaveBeenCalledWith(ctx.capture)
      expect(ctx.realtime.stopStream).toHaveBeenCalledTimes(1)
      expect(ctx.store.state).toMatchObject({ status: 'idle', viewerIds: [], stats: {} })
      expect(ctx.realtime.listenerCount).toBe(0)
    })

    it('stops when the browser ends the track (its own stop button)', async () => {
      await goLive()
      ctx.capture.video.onended?.()
      await vi.advanceTimersByTimeAsync(0)
      expect(ctx.realtime.stopStream).toHaveBeenCalledTimes(1)
      expect(ctx.store.state.status).toBe('idle')
    })

    it('keeps the settings of the last share', async () => {
      await goLive()
      await ctx.session.stop()
      expect(ctx.store.state.settings).toEqual(gameSettings)
    })

    it('ends with the call, without telling a room it is no longer in', async () => {
      await goLive()
      ctx.source.emit(null)
      expect(ctx.stopScreen).toHaveBeenCalled()
      expect(ctx.realtime.stopStream).not.toHaveBeenCalled()
      expect(ctx.store.state.status).toBe('idle')
    })

    it('ends when the call moves to another room', async () => {
      await goLive()
      ctx.source.emit(makeCallMedia('r2'))
      expect(ctx.store.state.status).toBe('idle')
    })

    it('can share again afterwards', async () => {
      await goLive()
      await ctx.session.stop()
      await goLive()
      expect(ctx.store.state.status).toBe('live')
      expect(ctx.captures).toHaveLength(2)
    })

    it('detach ends a share and stops following the call', async () => {
      await goLive()
      ctx.session.detach()
      expect(ctx.store.state.status).toBe('idle')
      expect(ctx.source.listenerCount).toBe(0)
    })
  })

  it('dismisses the notice', () => {
    ctx.store.setState({ notice: 'failed' })
    ctx.session.dismissNotice()
    expect(ctx.store.state.notice).toBeNull()
  })
})
