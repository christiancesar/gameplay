import { useSharePreviewViewModel } from '@/modules/screen-share/view-models/use-share-preview.view-model'
import { SharePreviewView, type SharePreviewViewProps } from '@/modules/screen-share/views/share-preview.view'
import { StreamVideoView } from '@/modules/screen-share/views/stream-video.view'

type SharePreviewScreenProps = Pick<SharePreviewViewProps, 'participants' | 'onWatch' | 'onVolumeChange'>

/** The stage while I present my own screen. */
export function SharePreviewScreen({ participants, onWatch, onVolumeChange }: SharePreviewScreenProps) {
  const { stream, hidden, onToggleHidden, onStop } = useSharePreviewViewModel()

  return (
    <SharePreviewView
      video={<StreamVideoView stream={stream} />}
      hidden={hidden}
      participants={participants}
      onToggleHidden={onToggleHidden}
      onStop={onStop}
      onWatch={onWatch}
      onVolumeChange={onVolumeChange}
    />
  )
}
