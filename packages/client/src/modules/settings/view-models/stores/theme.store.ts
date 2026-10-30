import type { Theme as AccountTheme } from '@gameplay/contracts'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = AccountTheme | 'system'

type ThemeState = {
  theme: Theme
  pendingAccountSync: boolean
  setTheme: (theme: Theme, pendingAccountSync?: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      pendingAccountSync: false,
      setTheme: (theme, pendingAccountSync = false) => set({ theme, pendingAccountSync }),
    }),
    {
      name: 'gameplay-theme',
    },
  ),
)
