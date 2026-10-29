import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AUDIO_HOLD_MS, AUDIO_POLL_MS } from './share-session.service'
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
    it('hands the host the source picked in the dialog, and none when the host picks', async () => {
      await ctx.session.start(gameSettings, 'smooth', undefined, 'window:7:0')
      expect(ctx.acquireScreen.mock.calls[0]?.[2]).toBe('window:7:0')

      await ctx.session.stop()
      await ctx.session.start(gameSettings, 'smooth')
      expect(ctx.acquireScreen.mock.calls[1]?.[2]).toBeNull()
    })

    it('opens the picker with the preset as constraints, then announces the stream', async () => {
      const pending = ctx.session.start(gameSettings, 'smooth')
      expect(ctx.store.state.status).toBe('picking')
      await pending
      expect(ctx.acquireScreen).toHaveBeenCalledTimes(1)
      const options = ctx.acquireScreen.mock.calls[0] as unknown as [DisplayMediaStreamOptions]
      expect(options[0].video).toMatchObject({ displaySurface: 'window', frameRate: { ideal: 60 } })
      expect(ctx.realtime.startStream).toHaveBeenCalledWith({ height: 1080, aspectRatio: '16:9', fps: 60 }, 'mesh')
      expect(ctx.store.state).toMatchObject({
        status: 'live',
        settings: gameSettings,
        source: { height: 1080, fps: 60 },
        preview: { stream: ctx.capture.stream, surface: 'unknown' },
      })
      expect(ctx.diagnostics.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'share.capture.started', attemptId: expect.any(String) }),
      )
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
      expect(ctx.diagnostics.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'share.capture.rejected', data: { reason: 'cancelled' } }),
      )
    })

    it('says why when the browser cannot capture', async () => {
      ctx.picker.answer = 'unsupported'
      await goLive()
      expect(ctx.store.state).toMatchObject({ status: 'idle', notice: 'unsupported' })
      ctx.picker.answer = 'fail'
      await goLive()
      expect(ctx.store.state.notice).toBe('failed')
      expect(ctx.diagnostics.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'share.capture.rejected', data: { reason: 'failed' } }),
      )
    })

    it('warns when audio was asked and the browser gave none, and reports it', async () => {
      ctx.picker.withAudio = false
      await goLive()
      expect(ctx.store.state).toMatchObject({ status: 'live', audio: 'missing', notice: 'no-audio' })
      expect(ctx.report).toHaveBeenCalledWith({
        source: 'window',
        surface: 'unknown',
        audioRequested: true,
        audioReceived: false,
      })
    })

    it('says nothing about audio that was not asked', async () => {
      ctx.picker.withAudio = false
      await goLive(tabSettings)
      expect(ctx.store.state).toMatchObject({ status: 'live', audio: 'off', notice: null })
      expect(ctx.report).toHaveBeenCalledWith(expect.objectContaining({ audioRequested: false, audioReceived: false }))
    })

    it('follows whether the captured audio has sound, and stops reading it with the share', async () => {
      const level = { value: 0 }
      const dispose = vi.fn()
      media.audio.createMeter.mockReturnValue({ read: () => level.value, dispose })
      await goLive()
      expect(media.audio.createMeter).toHaveBeenCalledWith(ctx.capture.stream)
      expect(ctx.store.state.audio).toBe('silent')
      level.value = 0.1
      await vi.advanceTimersByTimeAsync(AUDIO_POLL_MS)
      expect(ctx.store.state.audio).toBe('active')
      level.value = 0
      await vi.advanceTimersByTimeAsync(AUDIO_HOLD_MS + AUDIO_POLL_MS)
      expect(ctx.store.state.audio).toBe('silent')
      await ctx.session.stop()
      expect(dispose).toHaveBeenCalled()
      expect(ctx.store.state.audio).toBe('off')
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
        maxBitrate: 9_100_000,
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
          { userId: 'u1', muted: false, deafened: false, streaming: '1080p60', streamMode: 'mesh' },
          { userId: 'u3', muted: false, deafened: false, streaming: null, streamMode: null },
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
      expect(ctx.realtime.startStream).toHaveBeenLastCalledWith({ height: 720, aspectRatio: '16:9', fps: 30 }, 'mesh')
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
      expect(ctx.realtime.startStream).toHaveBeenLastCalledWith({ height: 1080, aspectRatio: '16:9', fps: 30 }, 'mesh')
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

  describe('through the SFU', () => {
    const goLiveSfu = (fallbackToMesh = true) =>
      ctx.session.start(gameSettings, 'smooth', { mode: 'sfu', fallbackToMesh })

    it('publishes the screen once with simulcast layers, then announces it in sfu mode', async () => {
      await goLiveSfu()

      const [tracks] = ctx.publishToSfu.mock.calls[0]
      expect(tracks.map((track) => track.kind)).toEqual(['video', 'audio'])
      expect(tracks[0].encodings?.map((layer) => layer.rid)).toEqual(['f', 'h', 'q'])
      expect(ctx.realtime.startStream).toHaveBeenCalledWith({ height: 1080, aspectRatio: '16:9', fps: 60 }, 'sfu')
      expect(ctx.store.state).toMatchObject({ status: 'live', mode: 'sfu', notice: null })
      expect(ctx.sfu.publications[0].sender.setParameters).toHaveBeenCalledWith(
        expect.objectContaining({ degradationPreference: 'maintain-framerate' }),
      )
    })

    it('lists who watches without sending them anything over the call', async () => {
      await goLiveSfu()
      await viewerAsks('u2')

      expect(ctx.store.state.viewerIds).toEqual(['u2'])
      expect(media.transport.addTrack).not.toHaveBeenCalled()
    })

    it('measures what goes up to the SFU, adding up the layers', async () => {
      await goLiveSfu()
      const publication = ctx.sfu.publications[0]
      publication.stats = [
        outbound({ bytesSent: 0, timestamp: 1000 }),
        outbound({ frameHeight: 540, bytesSent: 0, timestamp: 1000 }),
      ]
      await vi.advanceTimersByTimeAsync(1000)
      publication.stats = [
        outbound({ bytesSent: 750_000, timestamp: 2000 }),
        outbound({ frameHeight: 540, bytesSent: 250_000, timestamp: 2000 }),
      ]
      await vi.advanceTimersByTimeAsync(1000)

      expect(ctx.store.state.uplink).toMatchObject({ height: 1080, kbps: 8000 })
    })

    it('goes Direct (Mesh) with the same capture when the SFU fails', async () => {
      ctx.sfu.failing = true
      await goLiveSfu()

      expect(ctx.acquireScreen).toHaveBeenCalledTimes(1)
      expect(ctx.realtime.startStream).toHaveBeenCalledWith({ height: 1080, aspectRatio: '16:9', fps: 60 }, 'mesh')
      expect(ctx.store.state).toMatchObject({ status: 'live', mode: 'mesh', notice: 'fell-back' })
    })

    it('does not start when the SFU fails and Direct is off', async () => {
      ctx.sfu.failing = true
      await goLiveSfu(false)

      expect(ctx.realtime.startStream).not.toHaveBeenCalled()
      expect(ctx.store.state).toMatchObject({ status: 'idle', notice: 'start-failed' })
      expect(ctx.stopScreen).toHaveBeenCalled()
    })

    it('closes the SFU connection when the share stops', async () => {
      await goLiveSfu()
      await ctx.session.stop()
      expect(ctx.sfu.publications[0].close).toHaveBeenCalled()
      expect(ctx.realtime.stopStream).toHaveBeenCalled()
    })

    it('stops quietly and says why when the platform admin turns the mode off', async () => {
      await goLiveSfu()
      ctx.realtime.receive('stream:ended', { reason: 'disabled' })

      expect(ctx.store.state).toMatchObject({ status: 'idle', notice: 'disabled' })
      expect(ctx.sfu.publications[0].close).toHaveBeenCalled()
      expect(ctx.realtime.stopStream).not.toHaveBeenCalled()
    })
  })

  describe('quality each viewer asks for', () => {
    it('lightens only the connection of a Direct viewer who asked for less', async () => {
      await goLive()
      await viewerAsks('u2')
      await viewerAsks('u3')
      ctx.realtime.receive('stream:quality', { viewerId: 'u2', level: 'low' })
      await vi.advanceTimersByTimeAsync(0)

      const calls = media.transport.setVideoEncoding.mock.calls.filter(([viewerId]) => viewerId === 'u2')
      expect(calls.at(-1)?.[2]).toMatchObject({ scaleResolutionDownBy: 4, maxFramerate: 15, maxBitrate: 910_000 })
      const other = media.transport.setVideoEncoding.mock.calls.filter(([viewerId]) => viewerId === 'u3')
      expect(other.at(-1)?.[2]).toMatchObject({ maxBitrate: 9_100_000 })
    })

    it('through the SFU, shows what each viewer reports', async () => {
      await ctx.session.start(gameSettings, 'smooth', { mode: 'sfu', fallbackToMesh: true })
      await viewerAsks('u2')
      const quality = { width: 1280, height: 720, fps: 30, kbps: 2500 }
      ctx.realtime.receive('stream:received', { viewerId: 'u2', quality })
      ctx.realtime.receive('stream:received', { viewerId: 'u9', quality })

      expect(ctx.store.state.stats).toEqual({ u2: { ...quality, limitation: 'none' } })
    })
  })
})
