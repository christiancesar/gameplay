/**
 * Marks the stream player that goes fullscreen: the whole player, with its own controls over the video.
 * Never the `<video>` itself: a fullscreen video gets the browser's controls, and pausing a live stream there
 * only freezes it.
 */
const STREAM_STAGE_ATTRIBUTE = 'data-stream-stage'

type FullscreenRoot = Pick<Document, 'querySelector' | 'addEventListener' | 'removeEventListener'> & {
  readonly fullscreenElement: Element | null
  exitFullscreen?: () => Promise<void>
}

/**
 * Puts the player in real fullscreen where the browser allows it (desktop, Android). Resolves false where it
 * does not: the iPhone only has fullscreen for `<video>`, so there the player stays fullscreen by CSS alone.
 * Needs a user gesture.
 */
async function enterStreamFullscreen(root: FullscreenRoot = document): Promise<boolean> {
  const stage = root.querySelector(`[${STREAM_STAGE_ATTRIBUTE}]`)
  if (!stage || typeof stage.requestFullscreen !== 'function') return false
  try {
    await stage.requestFullscreen()
    lockLandscape()
    return true
  } catch {
    return false
  }
}

function exitStreamFullscreen(root: FullscreenRoot = document): void {
  if (!root.fullscreenElement || typeof root.exitFullscreen !== 'function') return
  void root.exitFullscreen().catch(() => undefined)
}

/** Tells when the browser leaves fullscreen on its own (Esc, the system back gesture). */
function onFullscreenExit(handler: () => void, root: FullscreenRoot = document): () => void {
  const listener = () => {
    if (!root.fullscreenElement) handler()
  }
  root.addEventListener('fullscreenchange', listener)
  return () => root.removeEventListener('fullscreenchange', listener)
}

/** A phone in fullscreen turns sideways, where the screen has the room. Only Android allows it. */
function lockLandscape() {
  const orientation = (globalThis.screen as { orientation?: { lock?: (to: string) => Promise<void> } } | undefined)
    ?.orientation
  void orientation?.lock?.('landscape').catch(() => undefined)
}

export { STREAM_STAGE_ATTRIBUTE, enterStreamFullscreen, exitStreamFullscreen, onFullscreenExit }
export type { FullscreenRoot }
