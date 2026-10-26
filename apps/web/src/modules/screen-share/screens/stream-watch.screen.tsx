import { useStreamWatchViewModel } from '@/modules/screen-share/view-models/use-stream-watch.view-model'
import { StreamVideoView } from '@/modules/screen-share/views/stream-video.view'
import { StreamViewerView, type StreamViewerViewProps } from '@/modules/screen-share/views/stream-viewer.view'

type StreamWatchScreenProps = Omit<
  StreamViewerViewProps,
  'video' | 'streamVolume' | 'onStreamVolumeChange' | 'onFullscreen'
>

export function StreamWatchScreen(props: StreamWatchScreenProps) {
  const { stream, volume, onVolumeChange, onFullscreen } = useStreamWatchViewModel()

  return (
    <StreamViewerView
      {...props}
      video={<StreamVideoView stream={stream} />}
      streamVolume={volume}
      onStreamVolumeChange={onVolumeChange}
      onFullscreen={onFullscreen}
    />
  )
}
