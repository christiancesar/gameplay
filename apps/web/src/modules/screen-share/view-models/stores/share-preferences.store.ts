import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { SharePriority, ShareSettings } from '@/modules/screen-share/model/entities/share'

/** The settings the user asked to use next time. Kept in this browser only; null means none saved. */
type SharePreferencesState = {
  saved: ShareSettings | null
  savedPriority: SharePriority
  save: (settings: ShareSettings, priority?: SharePriority) => void
  clear: () => void
}

const useSharePreferencesStore = create<SharePreferencesState>()(
  persist(
    (set) => ({
      saved: null,
      savedPriority: 'smooth',
      save: (saved, savedPriority = 'smooth') => set({ saved, savedPriority }),
      clear: () => set({ saved: null, savedPriority: 'smooth' }),
    }),
    { name: 'gameplay-share-preferences' },
  ),
)

export { useSharePreferencesStore }
