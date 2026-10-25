import type { Theme as AccountTheme } from '@gameplay/contracts'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = AccountTheme | 'system'

type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'gameplay-theme',
    },
  ),
)
