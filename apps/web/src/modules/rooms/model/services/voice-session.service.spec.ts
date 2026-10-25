import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fakeStream, fakeTrack } from '@/shared/media/test/media-fakes'

import { ICE_RETRY_MS } from './voice-session.service'
import { alone, iceRenewed, participant, withAna, withAnaAndBruna } from './test/voice-session-seed'
import { makeVoiceSessionContext } from './test/voice-session-context'

type Context = ReturnType<typeof makeVoiceSessionContext>

describe('VoiceSession', () => {
  let ctx: Context

  beforeEach(() => {
    vi.useFakeTimers()
    ctx = makeVoiceSessionContext()
  })
  afterEach(() => vi.useRealTimers())

  const join = async (participants = withAna, roomId = 'r1') => {
    ctx.realtime.participants = participants
    await ctx.session.join('s1', roomId)
  }

  describe('join', () => {
    it('takes the seat with the current mute state and connects to who is there', async () => {
      await join()
      expect(ctx.realtime.joinRoom).toHaveBeenCalledWith({
        roomId: 'r1',
        muted: false,
        deafened: false,
      })
      expect(ctx.store.state).toMatchObject({
        connection: { serverId: 's1', roomId: 'r1' },
        status: 'connected',
        participants: withAna,
        micDenied: false,
      })
      expect(ctx.transport.addPeer.mock.calls).toEqual([['u2']])
      expect(ctx.transport.setVoiceTrack).toHaveBeenCalledWith(ctx.microphones[0].track)
    })

    it('shows the room as soon as it starts joining', async () => {
      const pending = ctx.session.join('s1', 'r1')
      expect(ctx.store.state).toMatchObject({
        connection: { serverId: 's1', roomId: 'r1' },
        status: 'joining',
      })
      await pending
    })

    it('uses the input and output devices of the settings', async () => {
      ctx.state.preferences = { inputDeviceId: 'mic-2', outputDeviceId: 'spk-2' }
      await join()
      expect(ctx.acquireMicrophone).toHaveBeenCalledWith('mic-2')
      expect(ctx.engine.setSinkId).toHaveBeenCalledWith('spk-2')
    })

    it('loads the ICE servers for the transport', async () => {
      await join()
      expect(ctx.loadIceConfig).toHaveBeenCalledWith(false)
    })

    it('still joins when the ICE config cannot be loaded, and asks again soon', async () => {
      ctx.loadIceConfig.mockRejectedValueOnce(new Error('down'))
      await join()
      expect(ctx.store.state.status).toBe('connected')
      await vi.advanceTimersByTimeAsync(ICE_RETRY_MS)
      expect(ctx.loadIceConfig).toHaveBeenLastCalledWith(true)
      expect(ctx.transport.updateIceServers).toHaveBeenCalled()
    })

    it('listens only, with a flag, when the microphone is denied', async () => {
      ctx.state.microphone = { ok: false, reason: 'denied' }
      await join()
      expect(ctx.store.state).toMatchObject({ status: 'connected', micDenied: true })
      expect(ctx.transport.setVoiceTrack).toHaveBeenCalledWith(null)
      ctx.session.toggleMute()
      expect(ctx.store.state.muted).toBe(true)
    })

    it('gives up with a notice when the API refuses', async () => {
      ctx.realtime.joinError = new Error('ROOM_NOT_FOUND')
      await join()
      expect(ctx.store.state).toMatchObject({
        connection: null,
        status: 'idle',
        notice: 'join-failed',
      })
      expect(ctx.transport.close).toHaveBeenCalled()
      expect(ctx.engine.dispose).toHaveBeenCalled()
      expect(ctx.stopMicrophone).toHaveBeenCalledWith(ctx.microphones[0])
    })

    it('gives up without a signed in user', async () => {
      ctx.state.selfId = undefined
      await join()
      expect(ctx.store.state).toMatchObject({ connection: null, notice: 'join-failed' })
      expect(ctx.realtime.joinRoom).not.toHaveBeenCalled()
    })

    it('ignores joining the room it is already in', async () => {
      await join()
      await join()
      expect(ctx.realtime.joinRoom).toHaveBeenCalledTimes(1)
    })

    it('drops the microphone when the user leaves while it was being asked for', async () => {
      const pending = ctx.session.join('s1', 'r1')
      await ctx.session.leave()
      await pending
      expect(ctx.stopMicrophone).toHaveBeenCalledWith(ctx.microphones[0])
      expect(ctx.realtime.joinRoom).not.toHaveBeenCalled()
      expect(ctx.store.state.connection).toBeNull()
    })
  })

  describe('roster', () => {
    it('connects to who arrives and drops who leaves', async () => {
      await join()
      ctx.realtime.receive('room:participants', {
        serverId: 's1',
        roomId: 'r1',
        participants: withAnaAndBruna,
      })
      expect(ctx.transport.addPeer).toHaveBeenLastCalledWith('u3')
      ctx.realtime.receive('room:participants', {
        serverId: 's1',
        roomId: 'r1',
        participants: [participant('u1'), participant('u3')],
      })
      expect(ctx.transport.removePeer).toHaveBeenCalledWith('u2')
      expect(ctx.engine.removeStream).toHaveBeenCalledWith('u2')
      expect(ctx.watcher.unwatch).toHaveBeenCalledWith('u2')
      expect(ctx.store.state.participants).toHaveLength(2)
    })

    it('ignores the roster of another room', async () => {
      await join()
      ctx.realtime.receive('room:participants', {
        serverId: 's1',
        roomId: 'other',
        participants: withAnaAndBruna,
      })
      expect(ctx.transport.addPeer).toHaveBeenCalledTimes(1)
    })

    it('mirrors the status of each peer and forgets the ones that left', async () => {
      await join()
      ctx.transport.emitStatus('u2', 'connected')
      expect(ctx.store.state.peers).toEqual({ u2: 'connected' })
      ctx.realtime.receive('room:participants', {
        serverId: 's1',
        roomId: 'r1',
        participants: alone,
      })
      expect(ctx.store.state.peers).toEqual({})
    })
  })

  describe('call media', () => {
    it('gives the media of the call when it exists and null when it ends', async () => {
      const seen: (string | null)[] = []
      ctx.session.subscribeMedia((media) =>
        seen.push(media ? `${media.serverId}/${media.roomId}/${media.selfId}` : null),
      )
      await join()
      await ctx.session.leave()
      expect(seen).toEqual([null, 's1/r1/u1', null])
    })

    it('hands the transport and the audio output to who follows the media', async () => {
      let media: Parameters<Parameters<typeof ctx.session.subscribeMedia>[0]>[0] = null
      ctx.session.subscribeMedia((next) => (media = next))
      await join()
      expect(media).toMatchObject({ transport: ctx.transport, audio: ctx.engine })
    })

    it('stops telling after the unsubscribe', async () => {
      const handler = vi.fn()
      ctx.session.subscribeMedia(handler)()
      await join()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not play the screen audio as a voice', async () => {
      await join()
      const game = fakeTrack('audio', 'game')
      ctx.transport.emitTrack('u2', game, fakeStream([game]), 'screen')
      expect(ctx.engine.addStream).not.toHaveBeenCalled()
    })
  })

  describe('audio', () => {
    it('plays the voice of a peer and watches who is talking', async () => {
      await join()
      const stream = fakeStream()
      ctx.transport.emitTrack('u2', fakeTrack(), stream)
      expect(ctx.engine.addStream).toHaveBeenCalledWith('u2', stream)
      expect(ctx.watcher.watch).toHaveBeenCalledWith('u2', stream)
    })

    it('ignores video tracks (screen share is another ticket)', async () => {
      await join()
      ctx.transport.emitTrack('u2', fakeTrack('video'), fakeStream())
      expect(ctx.engine.addStream).not.toHaveBeenCalled()
    })

    it('shows who is speaking, including the local user', async () => {
      await join()
      expect(ctx.watcher.watch).toHaveBeenCalledWith('u1', ctx.microphones[0].stream)
      ctx.watcher.speak('u1', 'u2')
      expect(ctx.store.state.speaking).toEqual({ u1: true, u2: true })
      ctx.watcher.speak()
      expect(ctx.store.state.speaking).toEqual({})
    })
  })

  describe('mute and deafen', () => {
    it('mute silences the microphone, tells the room and stops the local speaking indicator', async () => {
      await join()
      ctx.session.toggleMute()
      expect(ctx.microphones[0].track.enabled).toBe(false)
      expect(ctx.realtime.sendVoiceState).toHaveBeenLastCalledWith({
        muted: true,
        deafened: false,
      })
      expect(ctx.watcher.unwatch).toHaveBeenCalledWith('u1')
      ctx.session.toggleMute()
      expect(ctx.microphones[0].track.enabled).toBe(true)
      expect(ctx.realtime.sendVoiceState).toHaveBeenLastCalledWith({
        muted: false,
        deafened: false,
      })
    })

    it('deafen stops the sound and also silences the microphone, keeping the mute choice', async () => {
      await join()
      ctx.session.toggleDeafen()
      expect(ctx.engine.setDeafened).toHaveBeenLastCalledWith(true)
      expect(ctx.microphones[0].track.enabled).toBe(false)
      expect(ctx.realtime.sendVoiceState).toHaveBeenLastCalledWith({ muted: true, deafened: true })
      expect(ctx.store.state.muted).toBe(false)
      ctx.session.toggleDeafen()
      expect(ctx.microphones[0].track.enabled).toBe(true)
      expect(ctx.realtime.sendVoiceState).toHaveBeenLastCalledWith({
        muted: false,
        deafened: false,
      })
    })

    it('a mute chosen before deafening survives undeafening', async () => {
      await join()
      ctx.session.toggleMute()
      ctx.session.toggleDeafen()
      ctx.session.toggleDeafen()
      expect(ctx.microphones[0].track.enabled).toBe(false)
      expect(ctx.realtime.sendVoiceState).toHaveBeenLastCalledWith({
        muted: true,
        deafened: false,
      })
    })

    it('unmuting while deafened also undeafens', async () => {
      await join()
      ctx.session.toggleDeafen()
      ctx.session.toggleMute()
      expect(ctx.store.state).toMatchObject({ muted: false, deafened: false })
      expect(ctx.engine.setDeafened).toHaveBeenLastCalledWith(false)
      expect(ctx.microphones[0].track.enabled).toBe(true)
    })

    it('does nothing outside a call', () => {
      ctx.session.toggleMute()
      ctx.session.toggleDeafen()
      expect(ctx.store.state.muted).toBe(false)
      expect(ctx.realtime.sendVoiceState).not.toHaveBeenCalled()
    })

    it('keeps mute and deafen when switching rooms, and resets them on leaving', async () => {
      await join()
      ctx.session.toggleMute()
      await join(withAna, 'r2')
      expect(ctx.realtime.joinRoom).toHaveBeenLastCalledWith({
        roomId: 'r2',
        muted: true,
        deafened: false,
      })
      await ctx.session.leave()
      expect(ctx.store.state.muted).toBe(false)
    })
  })

  describe('volume', () => {
    it('is kept in percent, clamped, and given to the audio of that person', async () => {
      await join()
      ctx.session.setVolume('u2', 150)
      expect(ctx.store.state.volumes).toEqual({ u2: 150 })
      expect(ctx.engine.setVolume).toHaveBeenLastCalledWith('u2', 1.5)
      ctx.session.setVolume('u2', 999)
      expect(ctx.store.state.volumes.u2).toBe(200)
    })

    it('applies a stored volume when the stream of that person arrives', async () => {
      ctx.session.setVolume('u2', 50)
      await join()
      ctx.transport.emitTrack('u2', fakeTrack(), fakeStream())
      expect(ctx.engine.setVolume).toHaveBeenCalledWith('u2', 0.5)
    })

    it('survives leaving the room', async () => {
      await join()
      ctx.session.setVolume('u2', 30)
      await ctx.session.leave()
      expect(ctx.store.state.volumes).toEqual({ u2: 30 })
    })
  })

  describe('switch and leave', () => {
    it('switching rooms releases the previous call and joins the new one', async () => {
      await join()
      const first = ctx.transport
      await join(alone, 'r2')
      expect(first.close).toHaveBeenCalled()
      expect(ctx.engines[0].dispose).toHaveBeenCalled()
      expect(ctx.stopMicrophone).toHaveBeenCalledWith(ctx.microphones[0])
      expect(ctx.transports).toHaveLength(2)
      expect(ctx.store.state.connection).toEqual({ serverId: 's1', roomId: 'r2' })
      // The API moves the seat on room:join; no extra leave.
      expect(ctx.realtime.leaveRoom).not.toHaveBeenCalled()
    })

    it('leaving frees the seat and everything the call held', async () => {
      await join()
      const listeners = ctx.realtime.listenerCount
      expect(listeners).toBeGreaterThan(0)
      await ctx.session.leave()
      expect(ctx.realtime.leaveRoom).toHaveBeenCalledTimes(1)
      expect(ctx.transport.close).toHaveBeenCalled()
      expect(ctx.engine.dispose).toHaveBeenCalled()
      expect(ctx.watcher.dispose).toHaveBeenCalled()
      expect(ctx.stopMicrophone).toHaveBeenCalled()
      expect(ctx.realtime.listenerCount).toBe(0)
      expect(ctx.store.state).toMatchObject({
        connection: null,
        status: 'idle',
        participants: [],
        peers: {},
      })
    })

    it('leaving twice, or outside a call, is harmless', async () => {
      await ctx.session.leave()
      expect(ctx.realtime.leaveRoom).not.toHaveBeenCalled()
      await join()
      await ctx.session.leave()
      await ctx.session.leave()
      expect(ctx.realtime.leaveRoom).toHaveBeenCalledTimes(1)
    })

    it('clears the speaking state when it ends', async () => {
      await join()
      ctx.watcher.speak('u2')
      await ctx.session.leave()
      expect(ctx.store.state.speaking).toEqual({})
    })
  })

  describe('reconnecting', () => {
    it('keeps the call while the socket is down and takes the same room back', async () => {
      await join()
      ctx.realtime.setStatus('reconnecting')
      expect(ctx.store.state.status).toBe('reconnecting')
      expect(ctx.transport.close).not.toHaveBeenCalled()
      vi.advanceTimersByTime(10_000)
      ctx.realtime.setStatus('connected')
      await vi.advanceTimersByTimeAsync(0)
      expect(ctx.realtime.joinRoom).toHaveBeenCalledTimes(2)
      expect(ctx.realtime.joinRoom).toHaveBeenLastCalledWith({
        roomId: 'r1',
        muted: false,
        deafened: false,
      })
      expect(ctx.store.state.status).toBe('connected')
      expect(ctx.transports).toHaveLength(1)
    })

    it('rejoins with the mute and deafen of the moment', async () => {
      await join()
      ctx.session.toggleDeafen()
      ctx.realtime.setStatus('reconnecting')
      ctx.realtime.setStatus('connected')
      await vi.advanceTimersByTimeAsync(0)
      expect(ctx.realtime.joinRoom).toHaveBeenLastCalledWith({
        roomId: 'r1',
        muted: true,
        deafened: true,
      })
    })

    it('updates the roster from the rejoin (people came and went meanwhile)', async () => {
      await join()
      ctx.realtime.setStatus('reconnecting')
      ctx.realtime.participants = [participant('u1'), participant('u3')]
      ctx.realtime.setStatus('connected')
      await vi.advanceTimersByTimeAsync(0)
      expect(ctx.transport.removePeer).toHaveBeenCalledWith('u2')
      expect(ctx.transport.addPeer).toHaveBeenLastCalledWith('u3')
    })

    it('does not rejoin on the first connection of the socket', async () => {
      await join()
      ctx.realtime.setStatus('connected')
      await vi.advanceTimersByTimeAsync(0)
      expect(ctx.realtime.joinRoom).toHaveBeenCalledTimes(1)
    })

    it('leaves with a notice when the room cannot be taken back', async () => {
      await join()
      ctx.realtime.setStatus('reconnecting')
      ctx.realtime.joinError = new Error('ROOM_NOT_FOUND')
      ctx.realtime.setStatus('connected')
      await vi.advanceTimersByTimeAsync(0)
      expect(ctx.store.state).toMatchObject({ connection: null, notice: 'reconnect-failed' })
      expect(ctx.transport.close).toHaveBeenCalled()
    })

    it('ends quietly when the socket gave up', async () => {
      await join()
      ctx.realtime.setStatus('disconnected')
      expect(ctx.store.state).toMatchObject({ connection: null, notice: null })
      expect(ctx.realtime.leaveRoom).not.toHaveBeenCalled()
    })
  })

  describe('losing the room', () => {
    it.each([
      ['other-tab', 'other-tab'],
      ['room-deleted', 'room-deleted'],
      ['removed', null],
    ] as const)('room:left %s ends the call', async (reason, notice) => {
      await join()
      ctx.realtime.receive('room:left', { roomId: 'r1', reason })
      expect(ctx.store.state).toMatchObject({ connection: null, notice })
      expect(ctx.transport.close).toHaveBeenCalled()
      expect(ctx.realtime.leaveRoom).not.toHaveBeenCalled()
    })

    it('ignores room:left of another room', async () => {
      await join()
      ctx.realtime.receive('room:left', { roomId: 'other', reason: 'other-tab' })
      expect(ctx.store.state.connection).not.toBeNull()
    })

    it.each(['kicked', 'left', 'deleted'] as const)('ends when the server is removed (%s)', async (reason) => {
      await join()
      ctx.realtime.receive('server:removed', { serverId: 's1', reason })
      expect(ctx.store.state).toMatchObject({ connection: null, status: 'idle' })
      expect(ctx.engine.dispose).toHaveBeenCalled()
    })

    it('keeps the call when another server is removed', async () => {
      await join()
      ctx.realtime.receive('server:removed', { serverId: 's2', reason: 'left' })
      expect(ctx.store.state.connection).not.toBeNull()
    })

    it('dismisses a notice', async () => {
      await join()
      ctx.realtime.receive('room:left', { roomId: 'r1', reason: 'other-tab' })
      ctx.session.dismissNotice()
      expect(ctx.store.state.notice).toBeNull()
    })
  })

  describe('peer failures', () => {
    it('retries a failed peer with a growing wait, until it connects', async () => {
      await join()
      ctx.transport.emitStatus('u2', 'failed')
      expect(ctx.store.state.peers.u2).toBe('failed')
      vi.advanceTimersByTime(1_999)
      expect(ctx.transport.retryPeer).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(ctx.transport.retryPeer).toHaveBeenCalledWith('u2')

      ctx.transport.emitStatus('u2', 'connecting')
      ctx.transport.emitStatus('u2', 'failed')
      vi.advanceTimersByTime(3_999)
      expect(ctx.transport.retryPeer).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(1)
      expect(ctx.transport.retryPeer).toHaveBeenCalledTimes(2)

      ctx.transport.emitStatus('u2', 'connected')
      ctx.transport.emitStatus('u2', 'failed')
      vi.advanceTimersByTime(2_000)
      expect(ctx.transport.retryPeer).toHaveBeenCalledTimes(3)
    })

    it('stops retrying someone who left', async () => {
      await join()
      ctx.transport.emitStatus('u2', 'failed')
      ctx.realtime.receive('room:participants', {
        serverId: 's1',
        roomId: 'r1',
        participants: alone,
      })
      vi.advanceTimersByTime(60_000)
      expect(ctx.transport.retryPeer).not.toHaveBeenCalled()
    })

    it('stops retrying when the call ends', async () => {
      await join()
      ctx.transport.emitStatus('u2', 'failed')
      await ctx.session.leave()
      vi.advanceTimersByTime(60_000)
      expect(ctx.transport.retryPeer).not.toHaveBeenCalled()
    })
  })

  describe('ICE renewal', () => {
    it('asks for new credentials before the TTL and hands them to the transport', async () => {
      await join()
      ctx.loadIceConfig.mockResolvedValue(iceRenewed)
      await vi.advanceTimersByTimeAsync((3600 - 90) * 1000 - 1)
      expect(ctx.loadIceConfig).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(ctx.loadIceConfig).toHaveBeenLastCalledWith(true)
      expect(ctx.transport.updateIceServers).toHaveBeenCalledWith(iceRenewed.iceServers)
      // and again for the next period
      await vi.advanceTimersByTimeAsync((3600 - 90) * 1000)
      expect(ctx.transport.updateIceServers).toHaveBeenCalledTimes(2)
    })

    it('does not renew STUN only credentials', async () => {
      ctx.loadIceConfig.mockResolvedValue({ iceServers: [], ttlSeconds: 0, requestIp: null })
      await join()
      await vi.advanceTimersByTimeAsync(24 * 3600 * 1000)
      expect(ctx.loadIceConfig).toHaveBeenCalledTimes(1)
    })

    it('tries again soon when a renewal fails', async () => {
      await join()
      ctx.loadIceConfig.mockRejectedValueOnce(new Error('down')).mockResolvedValue(iceRenewed)
      await vi.advanceTimersByTimeAsync((3600 - 90) * 1000)
      expect(ctx.transport.updateIceServers).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(ICE_RETRY_MS)
      expect(ctx.transport.updateIceServers).toHaveBeenCalledWith(iceRenewed.iceServers)
    })

    it('stops renewing when the call ends', async () => {
      await join()
      await ctx.session.leave()
      await vi.advanceTimersByTimeAsync(24 * 3600 * 1000)
      expect(ctx.loadIceConfig).toHaveBeenCalledTimes(1)
    })
  })

  describe('devices', () => {
    it('swaps the microphone in the call and stops the old one', async () => {
      await join()
      await ctx.session.setInputDevice('mic-9')
      expect(ctx.acquireMicrophone).toHaveBeenLastCalledWith('mic-9')
      expect(ctx.transport.setVoiceTrack).toHaveBeenLastCalledWith(ctx.microphones[1].track)
      expect(ctx.stopMicrophone).toHaveBeenCalledWith(ctx.microphones[0])
    })

    it('keeps the muted state on the new microphone', async () => {
      await join()
      ctx.session.toggleMute()
      await ctx.session.setInputDevice('mic-9')
      expect(ctx.microphones[1].track.enabled).toBe(false)
    })

    it('lifts listen only when a working microphone is chosen', async () => {
      ctx.state.microphone = { ok: false, reason: 'denied' }
      await join()
      ctx.state.microphone = { ok: true }
      await ctx.session.setInputDevice('mic-9')
      expect(ctx.store.state.micDenied).toBe(false)
      expect(ctx.transport.setVoiceTrack).toHaveBeenLastCalledWith(ctx.microphones[0].track)
    })

    it('keeps the current microphone when the new one fails', async () => {
      await join()
      ctx.state.microphone = { ok: false, reason: 'unavailable' }
      await ctx.session.setInputDevice('mic-9')
      expect(ctx.stopMicrophone).not.toHaveBeenCalled()
    })

    it('changes the speakers in the call', async () => {
      await join()
      ctx.session.setOutputDevice('spk-3')
      expect(ctx.engine.setSinkId).toHaveBeenLastCalledWith('spk-3')
    })

    it('does nothing outside a call', async () => {
      await ctx.session.setInputDevice('mic-9')
      ctx.session.setOutputDevice('spk-3')
      expect(ctx.acquireMicrophone).not.toHaveBeenCalled()
    })
  })
})
