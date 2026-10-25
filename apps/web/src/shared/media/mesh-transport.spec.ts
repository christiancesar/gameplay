import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FakePeerConnection } from './test/fake-peer-connection'
import { FakeSignaling } from './test/fake-signaling'
import { fakeStream, fakeTrack, signalData } from './test/media-fakes'
import { CONNECT_TIMEOUT_MS, MeshTransport } from './mesh-transport'
import type { PeerStatus } from './media-transport'

const flush = () => vi.advanceTimersByTimeAsync(0)

describe('MeshTransport', () => {
  let signaling: FakeSignaling
  let connections: FakePeerConnection[]
  let statuses: [string, PeerStatus][]
  let epochs: number

  // 'u5' is polite towards 'u3' and impolite towards 'u9' (the larger id is polite).
  const create = (selfId = 'u5') => {
    const transport = new MeshTransport({
      selfId,
      signaling,
      iceServers: [{ urls: ['stun:stun.test'] }],
      createPeerConnection: (configuration) => {
        const connection = new FakePeerConnection(configuration)
        connections.push(connection)
        return connection
      },
      createMediaStream: (tracks) => fakeStream(tracks),
      createEpoch: () => `epoch-${(epochs += 1)}`,
    })
    transport.onPeerStatus((peerId, status) => statuses.push([peerId, status]))
    return transport
  }

  beforeEach(() => {
    vi.useFakeTimers()
    signaling = new FakeSignaling()
    connections = []
    statuses = []
    epochs = 0
  })
  afterEach(() => vi.useRealTimers())

  it('opens one connection per peer with the ICE servers, once', () => {
    const transport = create()
    transport.addPeer('u9')
    transport.addPeer('u9')
    transport.addPeer('u3')
    expect(connections).toHaveLength(2)
    expect(connections[0].configuration).toEqual({ iceServers: [{ urls: ['stun:stun.test'] }] })
    expect(statuses).toEqual([
      ['u9', 'connecting'],
      ['u3', 'connecting'],
    ])
  })

  it('only the lower id makes the first offer: the other side waits and adopts the offered transceiver', async () => {
    const transport = create('u5')
    const mic = fakeTrack()
    await transport.setVoiceTrack(mic)
    transport.addPeer('u3') // u5 is polite towards u3
    expect(connections[0].transceivers).toHaveLength(0)
    await flush()
    expect(signaling.ofKind('offer')).toHaveLength(0)

    signaling.deliver('u3', 'offer', signalData('remote', { type: 'offer', sdp: 'remote-offer' }))
    await flush()
    expect(connections[0].transceivers).toHaveLength(1)
    expect(connections[0].transceivers[0].direction).toBe('sendrecv')
    expect(connections[0].senders[0].track).toBe(mic)
    expect(signaling.ofKind('answer')).toHaveLength(1)
  })

  it('offers when the connection asks to negotiate and relays the description', async () => {
    const transport = create()
    transport.addPeer('u9')
    connections[0].onnegotiationneeded?.()
    await flush()
    expect(signaling.sent).toEqual([
      {
        to: 'u9',
        kind: 'offer',
        data: { epoch: 'epoch-1', description: { type: 'offer', sdp: 'offer-sdp-1' } },
      },
    ])
  })

  it('answers an offer', async () => {
    const transport = create()
    transport.addPeer('u9')
    signaling.deliver('u9', 'offer', signalData('remote', { type: 'offer', sdp: 'remote-offer' }))
    await flush()
    expect(connections[0].remoteDescriptions).toEqual([{ type: 'offer', sdp: 'remote-offer' }])
    expect(signaling.ofKind('answer')).toEqual([
      {
        to: 'u9',
        kind: 'answer',
        data: { epoch: 'epoch-1', description: { type: 'answer', sdp: 'answer-sdp' } },
      },
    ])
  })

  it('creates the peer when an offer arrives before the roster does', async () => {
    const transport = create()
    signaling.deliver('u9', 'offer', signalData('remote', { type: 'offer', sdp: 'remote-offer' }))
    await flush()
    expect(connections).toHaveLength(1)
    expect(statuses).toContainEqual(['u9', 'connecting'])
    expect(signaling.ofKind('answer')).toHaveLength(1)
    transport.close()
  })

  it('applies an answer and then relays candidates in order', async () => {
    const transport = create()
    transport.addPeer('u9')
    connections[0].onnegotiationneeded?.()
    await flush()
    signaling.deliver('u9', 'answer', signalData('remote', { type: 'answer', sdp: 'remote-answer' }))
    signaling.deliver('u9', 'candidate', {
      epoch: 'remote',
      candidate: { candidate: 'cand-1', sdpMid: '0' },
    })
    await flush()
    expect(connections[0].remoteDescriptions).toEqual([{ type: 'answer', sdp: 'remote-answer' }])
    expect(connections[0].candidates).toEqual([{ candidate: 'cand-1', sdpMid: '0' }])
  })

  it('sends local ICE candidates to the peer', () => {
    const transport = create()
    transport.addPeer('u9')
    connections[0].fireCandidate({ candidate: 'local-cand', sdpMid: '0' })
    expect(signaling.ofKind('candidate')).toEqual([
      {
        to: 'u9',
        kind: 'candidate',
        data: { epoch: 'epoch-1', candidate: { candidate: 'local-cand', sdpMid: '0' } },
      },
    ])
  })

  it('ignores malformed signals and candidates of unknown peers', async () => {
    create()
    signaling.deliver('u9', 'offer', { nonsense: true })
    signaling.deliver('u9', 'answer', signalData('remote', { type: 'offer', sdp: 'x' }))
    signaling.deliver('u9', 'candidate', { epoch: 'remote', candidate: { candidate: 'c' } })
    await flush()
    expect(connections).toHaveLength(0)
  })

  describe('glare (both offer at once)', () => {
    it('the impolite side ignores the incoming offer', async () => {
      // u5 < u9: u5 is impolite towards u9.
      const transport = create('u1')
      transport.addPeer('u9')
      connections[0].onnegotiationneeded?.()
      await flush()
      signaling.deliver('u9', 'offer', signalData('remote', { type: 'offer', sdp: 'their-offer' }))
      await flush()
      expect(connections[0].remoteDescriptions).toEqual([])
      expect(signaling.ofKind('answer')).toEqual([])
    })

    it('the polite side gives way and answers', async () => {
      const transport = create('u9')
      transport.addPeer('u1')
      connections[0].onnegotiationneeded?.()
      await flush()
      signaling.deliver('u1', 'offer', signalData('remote', { type: 'offer', sdp: 'their-offer' }))
      await flush()
      expect(connections[0].remoteDescriptions).toEqual([{ type: 'offer', sdp: 'their-offer' }])
      expect(signaling.ofKind('answer')).toHaveLength(1)
    })

    it('drops candidates of the offer it ignored without failing', async () => {
      const transport = create('u1')
      transport.addPeer('u9')
      connections[0].onnegotiationneeded?.()
      await flush()
      signaling.deliver('u9', 'offer', signalData('remote', { type: 'offer', sdp: 'their-offer' }))
      signaling.deliver('u9', 'candidate', { epoch: 'remote', candidate: { candidate: 'c' } })
      await flush()
      expect(connections[0].candidates).toEqual([])
    })
  })

  it('starts over when the peer rebuilt its connection (new epoch)', async () => {
    const transport = create()
    transport.addPeer('u9')
    signaling.deliver('u9', 'offer', signalData('first', { type: 'offer', sdp: 'o1' }))
    await flush()
    signaling.deliver('u9', 'offer', signalData('second', { type: 'offer', sdp: 'o2' }))
    await flush()
    expect(connections).toHaveLength(2)
    expect(connections[0].closed).toBe(true)
    expect(connections[1].remoteDescriptions).toEqual([{ type: 'offer', sdp: 'o2' }])
    transport.close()
  })

  describe('status', () => {
    it('follows the connection state', () => {
      const transport = create()
      transport.addPeer('u9')
      connections[0].setConnectionState('connected')
      connections[0].setConnectionState('disconnected')
      connections[0].setConnectionState('failed')
      expect(statuses.map(([, status]) => status)).toEqual(['connecting', 'connected', 'connecting', 'failed'])
    })

    it('reports failed when it does not connect in time', () => {
      const transport = create()
      transport.addPeer('u9')
      vi.advanceTimersByTime(CONNECT_TIMEOUT_MS)
      expect(statuses.at(-1)).toEqual(['u9', 'failed'])
    })

    it('does not time out a connection that connected', () => {
      const transport = create()
      transport.addPeer('u9')
      connections[0].setConnectionState('connected')
      vi.advanceTimersByTime(CONNECT_TIMEOUT_MS * 2)
      expect(statuses.at(-1)).toEqual(['u9', 'connected'])
    })

    it('retry restarts ICE and goes back to connecting', () => {
      const transport = create()
      transport.addPeer('u9')
      connections[0].setConnectionState('failed')
      transport.retryPeer('u9')
      expect(connections[0].restartIce).toHaveBeenCalledTimes(1)
      expect(statuses.at(-1)).toEqual(['u9', 'connecting'])
    })

    it('does not retry a connected peer', () => {
      const transport = create()
      transport.addPeer('u9')
      connections[0].setConnectionState('connected')
      transport.retryPeer('u9')
      expect(connections[0].restartIce).not.toHaveBeenCalled()
    })
  })

  describe('tracks', () => {
    it('hands the remote stream over', () => {
      const transport = create()
      const received: unknown[] = []
      transport.onRemoteTrack((peerId, track, stream) => received.push([peerId, track.kind, stream]))
      transport.addPeer('u9')
      const stream = fakeStream()
      connections[0].fireTrack(fakeTrack(), [stream])
      expect(received).toEqual([['u9', 'audio', stream]])
    })

    it('builds a stream when the remote track came without one', () => {
      const transport = create()
      const received: MediaStream[] = []
      transport.onRemoteTrack((_peerId, _track, stream) => received.push(stream))
      transport.addPeer('u9')
      connections[0].fireTrack(fakeTrack())
      expect(received).toHaveLength(1)
    })

    it('sends the voice track to current and future peers, and can stop sending', async () => {
      const transport = create()
      transport.addPeer('u9')
      const mic = fakeTrack()
      await transport.setVoiceTrack(mic)
      transport.addPeer('u7')
      await flush()
      expect(connections[0].senders[0].track).toBe(mic)
      expect(connections[1].senders[0].track).toBe(mic)
      await transport.setVoiceTrack(null)
      expect(connections[0].senders[0].track).toBeNull()
    })

    it('adds and removes an extra track, renegotiating (screen share ready)', async () => {
      const transport = create()
      transport.addPeer('u9')
      const screen = fakeTrack('video')
      transport.addTrack('u9', screen, fakeStream([screen]))
      await flush()
      expect(signaling.ofKind('offer')).toHaveLength(1)
      transport.removeTrack('u9', screen)
      expect(connections[0].removeTrack).toHaveBeenCalledTimes(1)
    })
  })

  describe('ICE renewal', () => {
    it('gives new credentials to existing and future connections', () => {
      const transport = create()
      transport.addPeer('u9')
      const renewed = [{ urls: ['turn:turn.test'], username: 'u', credential: 'c' }]
      transport.updateIceServers(renewed)
      expect(connections[0].setConfiguration).toHaveBeenCalledWith({ iceServers: renewed })
      transport.addPeer('u3')
      expect(connections[1].configuration).toEqual({ iceServers: renewed })
    })

    it('survives a connection that refuses the configuration', () => {
      const transport = create()
      transport.addPeer('u9')
      connections[0].setConfiguration.mockImplementation(() => {
        throw new Error('closed')
      })
      expect(() => transport.updateIceServers([])).not.toThrow()
    })
  })

  describe('cleanup', () => {
    it('removing a peer closes its connection and ignores its later signals', async () => {
      const transport = create()
      transport.addPeer('u9')
      transport.removePeer('u9')
      expect(connections[0].closed).toBe(true)
      signaling.deliver('u9', 'candidate', { epoch: 'x', candidate: { candidate: 'c' } })
      await flush()
      expect(connections[0].candidates).toEqual([])
      expect(statuses.filter(([, status]) => status === 'failed')).toEqual([])
    })

    it('no timer fires after a peer is removed', () => {
      const transport = create()
      transport.addPeer('u9')
      transport.removePeer('u9')
      vi.advanceTimersByTime(CONNECT_TIMEOUT_MS * 2)
      expect(statuses).toEqual([['u9', 'connecting']])
    })

    it('close shuts every connection and stops listening to signals', () => {
      const transport = create()
      transport.addPeer('u9')
      transport.addPeer('u3')
      transport.close()
      expect(connections.every((connection) => connection.closed)).toBe(true)
      expect(signaling.listenerCount).toBe(0)
      transport.addPeer('u7')
      expect(connections).toHaveLength(2)
    })
  })
})
