/**
 * Marks the box around the stream video that goes fullscreen. Not the video itself: a fullscreen video gets
 * the browser's own controls, and pausing a live stream there only freezes it.
 */
const STREAM_STAGE_ATTRIBUTE = 'data-stream-stage'

/** Fullscreen for the stream being watched (or back out of it). The browser needs a user gesture for it. */
function toggleStreamFullscreen(root: Document = document): void {
  if (root.fullscreenElement) {
    void root.exitFullscreen().catch(() => undefined)
    return
  }
  const stage = root.querySelector(`[${STREAM_STAGE_ATTRIBUTE}]`)
  void stage?.requestFullscreen().catch(() => undefined)
}

export { STREAM_STAGE_ATTRIBUTE, toggleStreamFullscreen }
