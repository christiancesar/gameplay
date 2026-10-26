import {
  useSharePanelViewModel,
  type ViewerProfile,
} from '@/modules/screen-share/view-models/use-share-panel.view-model'
import { ShareDetailsDialogView } from '@/modules/screen-share/views/share-details-dialog.view'
import { SharePanelView } from '@/modules/screen-share/views/share-panel.view'
import { ShareSetupDialogView } from '@/modules/screen-share/views/share-setup-dialog.view'

type SharePanelScreenProps = { profiles: Readonly<Record<string, ViewerProfile>> }

export function SharePanelScreen({ profiles }: SharePanelScreenProps) {
  const { panel, setup, details, onStart, onStop, onOpenDetails, onChangeQuality } = useSharePanelViewModel(profiles)

  return (
    <>
      <SharePanelView
        state={panel}
        onStart={onStart}
        onStop={onStop}
        onOpenDetails={onOpenDetails}
        onChangeQuality={onChangeQuality}
      />
      <ShareSetupDialogView {...setup} />
      <ShareDetailsDialogView {...details} />
    </>
  )
}
