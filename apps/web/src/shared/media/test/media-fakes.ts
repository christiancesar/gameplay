import type { FakePeerConnection } from './fake-peer-connection'

/** Stand-ins for MediaStreamTrack and MediaStream, enough for the transport and the audio code. */
function fakeTrack(kind: 'audio' | 'video' = 'audio', id = `${kind}-track`): MediaStreamTrack {
  return { kind, id, enabled: true, stop: () => undefined } as unknown as MediaStreamTrack
}

function fakeStream(tracks: MediaStreamTrack[] = [fakeTrack()]): MediaStream {
  return {
    id: `stream-${tracks.map((track) => track.id).join('-')}`,
    getTracks: () => tracks,
    getAudioTracks: () => tracks.filter((track) => track.kind === 'audio'),
  } as unknown as MediaStream
}

/** Offer or answer data as the transport puts it in `signal:send`. */
function signalData(epoch: string, description: { type: 'offer' | 'answer'; sdp: string }) {
  return { epoch, description }
}

function lastConnection(connections: FakePeerConnection[]) {
  return connections[connections.length - 1]
}

export { fakeStream, fakeTrack, lastConnection, signalData }
