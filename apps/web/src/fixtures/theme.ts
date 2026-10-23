import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

const getTheme = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')

/** Liga o botão de tema da View à classe `dark` do documento (a mesma que a toolbar do Storybook aplica). */
export function useStoryTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme)
  return {
    theme,
    onToggleTheme: () => document.documentElement.classList.toggle('dark', theme !== 'dark'),
  } as const
}
