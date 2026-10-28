import type { DesktopBridge } from '@gameplay/desktop-bridge/bridge'

// `?url&no-inline`: a small file would be embedded as a data URL, which the CSP does not let a worklet load.
import workletUrl from './pcm-player.worklet.js?url&no-inline'

/** The sound of the computer without the app, as a track, and how to let go of it. */
type SystemAudioTrack = { track: MediaStreamTrack; close: () => void }

const SAMPLE_RATE = 48000

/**
 * Starts the capture helper in the main process and plays what it sends into a track. The player goes to a media stream
 * and never to the speakers: it is the sound that goes to the viewers, and the person hears it already. Null when the
 * capture did not start, which leaves the share without sound.
 */
async function openSystemAudioTrack(bridge: DesktopBridge): Promise<SystemAudioTrack | null> {
  let context: AudioContext | null = null
  let unsubscribe: (() => void) | null = null
  const release = () => {
    unsubscribe?.()
    unsubscribe = null
    void context?.close()
    context = null
    void bridge['system-audio:stop']()
  }
  try {
    context = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: 'interactive' })
    await context.audioWorklet.addModule(workletUrl)
    const player = new AudioWorkletNode(context, 'pcm-player', { numberOfInputs: 0, outputChannelCount: [2] })
    const destination = context.createMediaStreamDestination()
    player.connect(destination)
    // Listening comes first, so the first piece is not lost.
    unsubscribe = bridge.on('system-audio:pcm', (chunk) => player.port.postMessage(chunk))
    if (!(await bridge['system-audio:start']())) {
      release()
      return null
    }
    const track = destination.stream.getAudioTracks()[0]
    if (!track) {
      release()
      return null
    }
    return { track, close: release }
  } catch {
    release()
    return null
  }
}

export { openSystemAudioTrack }
export type { SystemAudioTrack }
