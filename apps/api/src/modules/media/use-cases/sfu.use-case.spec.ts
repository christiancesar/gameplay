import { NotInRoomError, NotStreamingError, PeerNotInRoomError } from '../../realtime/errors/realtime.errors'
import {
  SfuNotConfiguredError,
  SfuSessionLimitError,
  SfuSessionNotFoundError,
  SfuTrackNotFoundError,
} from '../errors/media.errors'
import { makeMediaContext } from '../test/media-context'
import { BROWSER_ANSWER, BROWSER_OFFER, SCREEN_TRACKS } from '../test/media-seed'
import { MAX_SFU_SESSIONS_PER_USER } from './create-sfu-session.use-case'

// Ana streams through the SFU in r1; Bia watches from r1; Caio sits in r2.
async function anaStreamingToBia() {
  const ctx = makeMediaContext()
  await ctx.join('ana', 'r1')
  await ctx.join('bia', 'r1')
  await ctx.join('caio', 'r2')
  const { sessionId: anaSession } = await ctx.createSession.execute({ userId: 'ana' })
  await ctx.publish.execute({ userId: 'ana', sessionId: anaSession, offer: BROWSER_OFFER, tracks: SCREEN_TRACKS })
  await ctx.updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: '1080p60', streamMode: 'sfu' })
  const { sessionId: biaSession } = await ctx.createSession.execute({ userId: 'bia' })
  return { ...ctx, anaSession, biaSession }
}

describe('SFU use-cases', () => {
  it('tells whether the SFU is configured', () => {
    const { getStatus, provider } = makeMediaContext()
    expect(getStatus.execute()).toEqual({ available: true, reason: null })

    provider.configured = false
    expect(getStatus.execute()).toEqual({ available: false, reason: 'not-configured' })
  })

  describe('sessions', () => {
    it('are created for people in a voice room, bound to that room', async () => {
      const { join, createSession, sfuSessions } = makeMediaContext()
      await expect(createSession.execute({ userId: 'ana' })).rejects.toBeInstanceOf(NotInRoomError)

      await join('ana', 'r1')
      const { sessionId } = await createSession.execute({ userId: 'ana' })

      expect(await sfuSessions.find(sessionId)).toEqual({
        sessionId,
        userId: 'ana',
        serverId: 's1',
        roomId: 'r1',
        published: [],
        pulled: [],
      })
    })

    it('fail without the SFU configured', async () => {
      const { join, createSession, provider } = makeMediaContext()
      await join('ana', 'r1')
      provider.configured = false

      await expect(createSession.execute({ userId: 'ana' })).rejects.toBeInstanceOf(SfuNotConfiguredError)
    })

    it('are limited per person', async () => {
      const { join, createSession } = makeMediaContext()
      await join('ana', 'r1')
      for (let i = 0; i < MAX_SFU_SESSIONS_PER_USER; i++) await createSession.execute({ userId: 'ana' })

      await expect(createSession.execute({ userId: 'ana' })).rejects.toBeInstanceOf(SfuSessionLimitError)
    })

    it("can't be used by someone else or from another room", async () => {
      const { join, createSession, renegotiate } = makeMediaContext()
      await join('ana', 'r1')
      await join('bia', 'r1')
      const { sessionId } = await createSession.execute({ userId: 'ana' })

      await expect(renegotiate.execute({ userId: 'bia', sessionId, answer: BROWSER_ANSWER })).rejects.toBeInstanceOf(
        SfuSessionNotFoundError,
      )

      await join('ana', 'r2')
      await expect(renegotiate.execute({ userId: 'ana', sessionId, answer: BROWSER_ANSWER })).rejects.toBeInstanceOf(
        SfuSessionNotFoundError,
      )
    })
  })

  it('publishes the screen tracks with names of their own', async () => {
    const { anaSession, provider, sfuSessions } = await anaStreamingToBia()

    expect(provider.calls[0]).toEqual({
      op: 'publish',
      sessionId: anaSession,
      tracks: [
        { mid: '0', trackName: 'screen-video-0' },
        { mid: '1', trackName: 'screen-audio-1' },
      ],
    })
    expect((await sfuSessions.publicationOf('ana'))?.sessionId).toBe(anaSession)
  })

  describe('watching', () => {
    it("pulls the streamer's tracks, with the chosen layer on the video", async () => {
      const { watch, biaSession, anaSession, provider, sfuSessions } = await anaStreamingToBia()

      const response = await watch.execute({ userId: 'bia', sessionId: biaSession, streamerId: 'ana', layer: 'h' })

      expect(response).toEqual({
        sessionDescription: { type: 'offer', sdp: 'sfu-offer' },
        requiresImmediateRenegotiation: true,
        tracks: [
          { mid: 'r1', kind: 'video' },
          { mid: 'r2', kind: 'audio' },
        ],
      })
      expect(provider.calls.at(-1)).toEqual({
        op: 'pull',
        sessionId: biaSession,
        tracks: [
          { sessionId: anaSession, trackName: 'screen-video-0', layer: 'h' },
          { sessionId: anaSession, trackName: 'screen-audio-1' },
        ],
      })
      expect((await sfuSessions.find(biaSession))?.pulled.map((track) => track.mid)).toEqual(['r1', 'r2'])
    })

    it('only works on someone streaming through the SFU in the same room', async () => {
      const { watch, biaSession, createSession, updateVoiceState } = await anaStreamingToBia()
      const { sessionId: caioSession } = await createSession.execute({ userId: 'caio' })

      await expect(
        watch.execute({ userId: 'caio', sessionId: caioSession, streamerId: 'ana', layer: 'f' }),
      ).rejects.toBeInstanceOf(PeerNotInRoomError)

      await updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: '1080p60', streamMode: 'mesh' })
      await expect(
        watch.execute({ userId: 'bia', sessionId: biaSession, streamerId: 'ana', layer: 'f' }),
      ).rejects.toBeInstanceOf(NotStreamingError)
    })

    it('switches the layer of a watched video only', async () => {
      const { watch, changeLayer, biaSession, anaSession, provider } = await anaStreamingToBia()
      await watch.execute({ userId: 'bia', sessionId: biaSession, streamerId: 'ana', layer: 'f' })

      await changeLayer.execute({ userId: 'bia', sessionId: biaSession, mid: 'r1', layer: 'q' })

      expect(provider.calls.at(-1)).toEqual({
        op: 'setLayer',
        sessionId: biaSession,
        mid: 'r1',
        track: { sessionId: anaSession, trackName: 'screen-video-0', layer: 'q' },
      })
      await expect(
        changeLayer.execute({ userId: 'bia', sessionId: biaSession, mid: 'r2', layer: 'q' }),
      ).rejects.toBeInstanceOf(SfuTrackNotFoundError)
    })

    it('passes the answer to the SFU offer on', async () => {
      const { renegotiate, biaSession, provider } = await anaStreamingToBia()

      await renegotiate.execute({ userId: 'bia', sessionId: biaSession, answer: BROWSER_ANSWER })

      expect(provider.calls.at(-1)).toEqual({ op: 'renegotiate', sessionId: biaSession })
    })
  })

  describe('closing tracks', () => {
    it('closes known tracks, with or without renegotiating', async () => {
      const { watch, closeTracks, biaSession, provider, sfuSessions } = await anaStreamingToBia()
      await watch.execute({ userId: 'bia', sessionId: biaSession, streamerId: 'ana', layer: 'f' })

      expect(
        await closeTracks.execute({ userId: 'bia', sessionId: biaSession, mids: ['r1'], offer: BROWSER_OFFER }),
      ).toEqual({ sessionDescription: { type: 'answer', sdp: 'sfu-close-answer' } })
      expect(await closeTracks.execute({ userId: 'bia', sessionId: biaSession, mids: ['r2'] })).toEqual({
        sessionDescription: null,
      })

      expect(provider.calls.slice(-2)).toEqual([
        { op: 'close', sessionId: biaSession, mids: ['r1'], negotiated: true },
        { op: 'close', sessionId: biaSession, mids: ['r2'], negotiated: false },
      ])
      expect((await sfuSessions.find(biaSession))?.pulled).toEqual([])
      await expect(closeTracks.execute({ userId: 'bia', sessionId: biaSession, mids: ['r1'] })).rejects.toBeInstanceOf(
        SfuTrackNotFoundError,
      )
    })

    it("drops the viewers' pulls of a screen track the streamer closed", async () => {
      const { watch, closeTracks, anaSession, biaSession, sfuSessions } = await anaStreamingToBia()
      await watch.execute({ userId: 'bia', sessionId: biaSession, streamerId: 'ana', layer: 'f' })

      await closeTracks.execute({ userId: 'ana', sessionId: anaSession, mids: ['1'] })

      expect((await sfuSessions.find(biaSession))?.pulled.map((track) => track.kind)).toEqual(['video'])
    })
  })
})
