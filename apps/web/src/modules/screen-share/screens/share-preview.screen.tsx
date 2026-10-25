import { useSharePreviewViewModel } from '@/modules/screen-share/view-models/use-share-preview.view-model'
import { SharePreviewView } from '@/modules/screen-share/views/share-preview.view'
import { StreamVideoView } from '@/modules/screen-share/views/stream-video.view'

/** The streamer's own preview, or nothing while not sharing. */
export function SharePreviewScreen() {
  const { visible, stream, hidden, onToggleHidden, onStop } = useSharePreviewViewModel()
  if (!visible) return null

  return (
    <SharePreviewView
      video={<StreamVideoView stream={stream} />}
      hidden={hidden}
      onToggleHidden={onToggleHidden}
      onStop={onStop}
    />
  )
}
