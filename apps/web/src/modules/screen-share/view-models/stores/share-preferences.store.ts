import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { SharePriority, ShareSettings } from '@/modules/screen-share/model/entities/share'

/** The settings the user asked to use next time. Kept in this browser only; null means none saved. */
type SharePreferencesState = {
  saved: ShareSettings | null
  savedPriority: SharePriority
  /** The streamer's choice for the own-screen preview; null means none yet (the default depends on the surface). */
  previewHidden: boolean | null
  setPreviewHidden: (hidden: boolean) => void
  save: (settings: ShareSettings, priority?: SharePriority) => void
  clear: () => void
}

const useSharePreferencesStore = create<SharePreferencesState>()(
  persist(
    (set) => ({
      saved: null,
      savedPriority: 'smooth',
      previewHidden: null,
      setPreviewHidden: (previewHidden) => set({ previewHidden }),
      save: (saved, savedPriority = 'smooth') => set({ saved, savedPriority }),
      clear: () => set({ saved: null, savedPriority: 'smooth' }),
    }),
    { name: 'gameplay-share-preferences' },
  ),
)

export { useSharePreferencesStore }
