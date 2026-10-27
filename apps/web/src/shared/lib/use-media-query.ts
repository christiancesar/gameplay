import { useCallback, useSyncExternalStore } from 'react'

/** Whether a media query matches now, following its changes. False where there is no `matchMedia`. */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => undefined
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches),
    () => false,
  )
}

/** A phone turned sideways: the same query as the `phone-landscape` CSS variant. */
const PHONE_LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 32rem)'

export { PHONE_LANDSCAPE_QUERY, useMediaQuery }
