import type { StreamQualityLevel } from '@gameplay/contracts'
import { useCallback, useEffect, useRef } from 'react'

import { isImmersive } from '@/modules/screen-share/model/rules/immersive'
import { PHONE_LANDSCAPE_QUERY, useMediaQuery } from '@/shared/lib/use-media-query'
import { enterStreamFullscreen, exitStreamFullscreen, onFullscreenExit } from '@/shared/media/fullscreen'

import { shareController } from './share.controller'
import { idlePlayer, useStreamPlayerStore } from './stores/stream-player.store'
import { useWatchStore } from './stores/watch.store'

/**
 * The screen being watched: its video, its own volume and the immersive player (the video over the whole
 * screen, controls on top). A phone turned sideways goes immersive by itself. Who to watch comes from the URL.
 */
function useStreamWatchViewModel() {
  const stream = useWatchStore((state) => state.stream)
  const volume = useWatchStore((state) => state.volume)
  const status = useWatchStore((state) => state.status)
  const quality = useWatchStore((state) => state.quality)
  const hasAudio = useWatchStore((state) => state.hasAudio)
  const level = useWatchStore((state) => state.level)
  const { expanded, landscapeOptOut } = useStreamPlayerStore()
  const phoneLandscape = useMediaQuery(PHONE_LANDSCAPE_QUERY)
  const sideways = useRef(phoneLandscape)

  // Turning upright again lets the next turn sideways go immersive.
  useEffect(() => {
    sideways.current = phoneLandscape
    if (!phoneLandscape) useStreamPlayerStore.setState({ landscapeOptOut: false })
  }, [phoneLandscape])

  // Left while sideways, it stays out until the phone turns upright.
  const leave = useCallback(() => {
    useStreamPlayerStore.setState({ expanded: false, landscapeOptOut: sideways.current })
  }, [])

  // Esc or the system gesture leaves real fullscreen: the player leaves immersive with it.
  useEffect(() => onFullscreenExit(leave), [leave])

  // The player is gone (stopped watching, left the room): next time starts normal.
  useEffect(() => () => useStreamPlayerStore.setState({ ...idlePlayer }), [])

  function setImmersive(next: boolean) {
    if (next) {
      useStreamPlayerStore.setState({ expanded: true, landscapeOptOut: false })
      // Inside the click: the browser only grants fullscreen to a user gesture.
      void enterStreamFullscreen()
      return
    }
    leave()
    exitStreamFullscreen()
  }

  return {
    stream,
    isWaiting: status !== 'playing',
    volume,
    received: quality ?? undefined,
    // Nothing to say about audio before the video is in.
    hasAudio: status !== 'playing' || hasAudio,
    immersive: isImmersive({ expanded, phoneLandscape, landscapeOptOut }),
    level,
    onVolumeChange: (next: number) => shareController.setStreamVolume(next),
    onLevelChange: (next: StreamQualityLevel) => shareController.setStreamQuality(next),
    onImmersiveChange: setImmersive,
  }
}

export { useStreamWatchViewModel }
