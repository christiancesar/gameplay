import { MoonIcon, SunIcon } from 'lucide-react'

import { IconButton } from '@/shared/ui/icon-button'

type ThemeToggleProps = {
  theme: 'dark' | 'light'
  onToggle: () => void
  labels: { toLight: string; toDark: string }
}

function ThemeToggle({ theme, onToggle, labels }: ThemeToggleProps) {
  return (
    <IconButton
      label={theme === 'dark' ? labels.toLight : labels.toDark}
      icon={theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      onClick={onToggle}
    />
  )
}

export { ThemeToggle }
export type { ThemeToggleProps }
