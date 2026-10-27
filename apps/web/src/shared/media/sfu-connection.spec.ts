import { describe, expect, it } from 'vitest'

import { SfuConnection } from './sfu-connection'
import { FakePeerConnection } from './test/fake-peer-connection'
import { createFakeSfuSignaling } from './test/fake-sfu-signaling'
import { fakeStream, fakeTrack } from './test/media-fakes'

function setup() {
  const signaling = createFakeSfuSignaling()
  const pcs: FakePeerConnection[] = []
  const deps = {
    signaling,
    iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
    createPeerConnection: (configuration: RTCConfiguration) => {
      const pc = new FakePeerConnection(configuration)
      pcs.push(pc)
      return pc
    },
  }
  return { signaling, pcs, deps }
}

describe('SfuConnection', () => {
  it('publishes the screen tracks with the simulcast layers and applies the answer', async () => {
    const { signaling, pcs, deps } = setup()
    const video = fakeTrack('video')
    const audio = fakeTrack('audio')
    const encodings = [{ rid: 'f' }, { rid: 'h', scaleResolutionDownBy: 2 }]

    const connection = await SfuConnection.publish(deps, [
      { track: video, stream: fakeStream([video, audio]), kind: 'video', encodings },
      { track: audio, stream: fakeStream([video, audio]), kind: 'audio' },
    ])

    expect(signaling.publish).toHaveBeenCalledWith('sfu-1', { type: 'offer', sdp: 'offer-sdp-1' }, [
      { mid: '0', kind: 'video' },
      { mid: '1', kind: 'audio' },
    ])
    expect(pcs[0].remoteDescriptions).toEqual([{ type: 'answer', sdp: 'sfu-answer' }])
    expect(pcs[0].transceivers.map((t) => t.direction)).toEqual(['sendonly', 'sendonly'])
    expect(connection.senderOf(video)?.getParameters().encodings).toEqual(encodings)
  })

  it('waits for the ICE candidates before sending the offer', async () => {
    const { signaling, pcs, deps } = setup()
    const create = deps.createPeerConnection
    deps.createPeerConnection = (configuration) => {
      const pc = create(configuration) as FakePeerConnection
      pc.iceGatheringState = 'gathering'
      return pc
    }
    const video = fakeTrack('video')

    const publishing = SfuConnection.publish(deps, [{ track: video, stream: fakeStream([video]), kind: 'video' }])
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(signaling.publish).not.toHaveBeenCalled()

    pcs[0].finishGathering()
    await publishing
    expect(signaling.publish).toHaveBeenCalled()
  })

  it('closes the connection when publishing fails', async () => {
    const { signaling, pcs, deps } = setup()
    signaling.failing = true
    const video = fakeTrack('video')

    await expect(
      SfuConnection.publish(deps, [{ track: video, stream: fakeStream([video]), kind: 'video' }]),
    ).rejects.toThrow('SFU down')
    expect(pcs[0].closed).toBe(true)
  })

  it("watches by answering the SFU's offer, and tells the API when closing", async () => {
    const { signaling, pcs, deps } = setup()
    const tracks: MediaStreamTrack[] = []

    const connection = await SfuConnection.watch(deps, 'u2', 'h', (event) => tracks.push(event.track))
    pcs[0].fireTrack(fakeTrack('video'))

    expect(signaling.watch).toHaveBeenCalledWith('sfu-1', 'u2', 'h')
    expect(pcs[0].remoteDescriptions).toEqual([{ type: 'offer', sdp: 'sfu-offer' }])
    expect(signaling.renegotiate).toHaveBeenCalledWith('sfu-1', { type: 'answer', sdp: 'answer-sdp' })
    expect(tracks).toHaveLength(1)

    await connection.setLayer('q')
    expect(signaling.setLayer).toHaveBeenCalledWith('sfu-1', '0', 'q')

    connection.close()
    connection.close()
    expect(pcs[0].closed).toBe(true)
    expect(signaling.close).toHaveBeenCalledTimes(1)
    expect(signaling.close).toHaveBeenCalledWith('sfu-1', ['0', '1'])
  })
})
