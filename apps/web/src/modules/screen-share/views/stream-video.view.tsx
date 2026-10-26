import { Loader2Icon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

type StreamVideoViewProps = {
  /** Null until the video of the stream arrives. */
  stream: MediaStream | null
}

/**
 * The video of the screen being watched. Muted: its audio goes through the audio engine, with its own volume.
 * A live stream has nothing to pause: whatever pauses it (media keys, picture in picture) plays it again.
 */
function StreamVideoView({ stream }: StreamVideoViewProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    element.srcObject = stream
    if (stream) void element.play().catch(() => undefined)
  }, [stream])

  if (!stream) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm" role="status">
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
        {t('share.loadingStream')}
      </p>
    )
  }

  return (
    <video
      ref={ref}
      data-stream-video=""
      autoPlay
      playsInline
      muted
      disableRemotePlayback
      onPause={(event) => void event.currentTarget.play().catch(() => undefined)}
      className="size-full object-contain"
    />
  )
}

export { StreamVideoView }
export type { StreamVideoViewProps }
