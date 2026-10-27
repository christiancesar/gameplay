import { isPreviewHiddenByDefault } from '@/modules/screen-share/model/rules/surface'

import { shareController } from './share.controller'
import { useSharePreferencesStore } from './stores/share-preferences.store'
import { useShareStore } from './stores/share.store'

/** The streamer's own preview in the room stage: the local capture, and whether the user hid it. */
function useSharePreviewViewModel() {
  const preview = useShareStore((state) => state.preview)
  const live = useShareStore((state) => state.status === 'live')
  const choice = useSharePreferencesStore((state) => state.previewHidden)

  const hidden = preview ? (choice ?? isPreviewHiddenByDefault(preview.surface)) : false

  return {
    visible: live && preview !== null,
    stream: preview?.stream ?? null,
    hidden,
    onToggleHidden: () => useSharePreferencesStore.getState().setPreviewHidden(!hidden),
    onStop: () => void shareController.stop(),
  }
}

export { useSharePreviewViewModel }
