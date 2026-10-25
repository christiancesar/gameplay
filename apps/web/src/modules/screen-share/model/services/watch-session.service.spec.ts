import { beforeEach, describe, expect, it } from 'vitest'

import { fakeStream, fakeTrack } from '@/shared/media/test/media-fakes'

import { makeWatchSessionContext } from './test/watch-session-context'
import { makeCallMedia } from './test/screen-seed'

type Context = ReturnType<typeof makeWatchSessionContext>

const roster = (...live: string[]) => ({
  serverId: 's1',
  roomId: 'r1',
  participants: ['u1', 'u2', 'u3'].map((userId) => ({
    userId,
    muted: false,
    deafened: false,
    streaming: live.includes(userId) ? ('1080p60' as const) : null,
  })),
})

describe('WatchSession', () => {
  let ctx: Context
  let media: ReturnType<typeof makeCallMedia>

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
})
