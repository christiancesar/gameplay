import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ShareSettings } from '@/modules/screen-share/model/entities/share'

/** The settings the user asked to use next time. Kept in this browser only; null means none saved. */
type SharePreferencesState = {
  saved: ShareSettings | null
  save: (settings: ShareSettings) => void
  clear: () => void
}

const useSharePreferencesStore = create<SharePreferencesState>()(
  persist(
    (set) => ({
      saved: null,
      save: (saved) => set({ saved }),
      clear: () => set({ saved: null }),
    }),
    { name: 'gameplay-share-preferences' },
  ),
)

export { useSharePreferencesStore }
