type MicrophoneHandle = { stream: MediaStream; track: MediaStreamTrack }

type MicrophoneResult =
  | { ok: true; microphone: MicrophoneHandle }
  /** `denied`: permission refused. `unavailable`: no device, or it is busy. Both join listen only. */
  | { ok: false; reason: 'denied' | 'unavailable' }

type GetUserMedia = (constraints: MediaStreamConstraints) => Promise<MediaStream>

const browserGetUserMedia: GetUserMedia = (constraints) => navigator.mediaDevices.getUserMedia(constraints)

/** Voice constraints: the browser cancels echo and noise and levels the volume (game audio would turn these off). */
function voiceConstraints(deviceId: string | undefined): MediaStreamConstraints {
  return {
    audio: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  }
}

async function acquireMicrophone(
  deviceId: string | undefined,
  getUserMedia: GetUserMedia = browserGetUserMedia,
): Promise<MicrophoneResult> {
  try {
    const stream = await getUserMedia(voiceConstraints(deviceId))
    const [track] = stream.getAudioTracks()
    if (!track) return { ok: false, reason: 'unavailable' }
    return { ok: true, microphone: { stream, track } }
  } catch (error) {
    const name = error instanceof DOMException || error instanceof Error ? error.name : ''
    // A picked device that is gone: retry on the system default before giving up.
    if (deviceId && name === 'OverconstrainedError') return acquireMicrophone(undefined, getUserMedia)
    return {
      ok: false,
      reason: name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable',
    }
  }
}

function stopMicrophone({ stream }: MicrophoneHandle) {
  for (const track of stream.getTracks()) track.stop()
}

export { acquireMicrophone, stopMicrophone, voiceConstraints }
export type { GetUserMedia, MicrophoneHandle, MicrophoneResult }
