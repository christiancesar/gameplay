import { useLayoutEffect } from 'react'

import { useThemeStore } from '@/modules/settings/view-models/stores/theme.store'

const DARK_QUERY = '(prefers-color-scheme: dark)'

export function ThemeSync() {
  const theme = useThemeStore((state) => state.theme)

  useLayoutEffect(() => {
    const root = window.document.documentElement
    const apply = (name: 'light' | 'dark') => {
      root.classList.remove('light', 'dark')
      root.classList.add(name)
    }

    if (theme !== 'system') {
      apply(theme)
      return
    }

    const media = window.matchMedia(DARK_QUERY)
    const sync = () => apply(media.matches ? 'dark' : 'light')
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [theme])

  return null
}
