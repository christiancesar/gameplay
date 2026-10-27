import { useStreamWatchViewModel } from '@/modules/screen-share/view-models/use-stream-watch.view-model'
import { StreamVideoView } from '@/modules/screen-share/views/stream-video.view'
import { StreamViewerView, type StreamViewerViewProps } from '@/modules/screen-share/views/stream-viewer.view'

type StreamWatchScreenProps = Omit<
  StreamViewerViewProps,
  'video' | 'streamVolume' | 'onStreamVolumeChange' | 'immersive' | 'onImmersiveChange' | 'received' | 'hasAudio'
>

export function StreamWatchScreen(props: StreamWatchScreenProps) {
  const { stream, volume, received, hasAudio, immersive, onVolumeChange, onImmersiveChange } = useStreamWatchViewModel()

  return (
    <StreamViewerView
      {...props}
      video={<StreamVideoView stream={stream} />}
      streamVolume={volume}
      received={received}
      hasAudio={hasAudio}
      onStreamVolumeChange={onVolumeChange}
      immersive={immersive}
      onImmersiveChange={onImmersiveChange}
    />
  )
}
