/** Marks the element that goes fullscreen when watching a stream. */
const STREAM_VIDEO_ATTRIBUTE = 'data-stream-video'

/** Fullscreen for the stream being watched (or back out of it). The browser needs a user gesture for it. */
function toggleStreamFullscreen(root: Document = document): void {
  if (root.fullscreenElement) {
    void root.exitFullscreen().catch(() => undefined)
    return
  }
  const video = root.querySelector(`[${STREAM_VIDEO_ATTRIBUTE}]`)
  void video?.requestFullscreen().catch(() => undefined)
}

export { STREAM_VIDEO_ATTRIBUTE, toggleStreamFullscreen }
