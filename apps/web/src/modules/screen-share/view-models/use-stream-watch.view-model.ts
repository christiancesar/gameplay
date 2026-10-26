import { shareController } from './share.controller'
import { useWatchStore } from './stores/watch.store'
import { toggleStreamFullscreen } from '@/shared/media/fullscreen'

/** The screen being watched: its video, its own volume and fullscreen. Who to watch comes from the URL. */
function useStreamWatchViewModel() {
  const stream = useWatchStore((state) => state.stream)
  const volume = useWatchStore((state) => state.volume)
  const status = useWatchStore((state) => state.status)
  const quality = useWatchStore((state) => state.quality)
  const hasAudio = useWatchStore((state) => state.hasAudio)

  return {
    stream,
    isWaiting: status !== 'playing',
    volume,
    received: quality ?? undefined,
    // Nothing to say about audio before the video is in.
    hasAudio: status !== 'playing' || hasAudio,
    onVolumeChange: (next: number) => shareController.setStreamVolume(next),
    onFullscreen: () => toggleStreamFullscreen(),
  }
}

export { useStreamWatchViewModel }
