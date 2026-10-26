type ScreenCaptureHandle = {
  stream: MediaStream
  video: MediaStreamTrack
  /** Missing when the user did not share audio or the source has none (a single window). */
  audio: MediaStreamTrack | null
}

type ScreenCaptureResult =
  | { ok: true; capture: ScreenCaptureHandle }
  /** `cancelled`: the user closed the picker. `unsupported`: no `getDisplayMedia`. `failed`: anything else. */
  | { ok: false; reason: 'cancelled' | 'unsupported' | 'failed' }

type GetDisplayMedia = (options: DisplayMediaStreamOptions) => Promise<MediaStream>

const browserGetDisplayMedia: GetDisplayMedia | undefined =
  typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function'
    ? (options) => navigator.mediaDevices.getDisplayMedia(options)
    : undefined

/** Opens the browser's picker. The factory is a parameter so specs and Storybook never touch the real API. */
async function acquireScreen(
  options: DisplayMediaStreamOptions,
  getDisplayMedia: GetDisplayMedia | undefined = browserGetDisplayMedia,
): Promise<ScreenCaptureResult> {
  if (!getDisplayMedia) return { ok: false, reason: 'unsupported' }
  try {
    const stream = await getDisplayMedia(options)
    const [video] = stream.getVideoTracks()
    if (!video) {
      for (const track of stream.getTracks()) track.stop()
      return { ok: false, reason: 'failed' }
    }
    return { ok: true, capture: { stream, video, audio: stream.getAudioTracks()[0] ?? null } }
  } catch (error) {
    const name = error instanceof DOMException || error instanceof Error ? error.name : ''
    // Closing the picker rejects with NotAllowedError (or AbortError in some browsers).
    return { ok: false, reason: name === 'NotAllowedError' || name === 'AbortError' ? 'cancelled' : 'failed' }
  }
}

function stopScreen({ stream }: ScreenCaptureHandle) {
  for (const track of stream.getTracks()) track.stop()
}

export { acquireScreen, stopScreen }
export type { GetDisplayMedia, ScreenCaptureHandle, ScreenCaptureResult }
