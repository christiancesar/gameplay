import { useEffect } from 'react'

import { nextIconIndex, shouldRotateFavicon } from '@/modules/browser-support/model/rules/favicon-rotation'
import { FAVICON_ICONS, iconToDataUrl, setFavicon } from '@/modules/browser-support/model/services/favicon.service'

const ROTATION_INTERVAL_MS = 10_000
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Rotates the tab icon through the Lucide gaming icons. It stops while the tab is hidden and does
 * not rotate at all when the person prefers reduced motion. Mounted once, from the root layout.
 */
function useRotatingFaviconViewModel() {
  useEffect(() => {
    const urls = FAVICON_ICONS.map((icon) => iconToDataUrl(icon))
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY)
    let index = 0
    let timer: ReturnType<typeof setInterval> | undefined

    const apply = () => setFavicon(urls[index])
    const sync = () => {
      clearInterval(timer)
      timer = undefined
      if (!shouldRotateFavicon({ hidden: document.hidden, reducedMotion: reducedMotion.matches })) return
      timer = setInterval(() => {
        index = nextIconIndex(index, urls.length)
        apply()
      }, ROTATION_INTERVAL_MS)
    }

    apply()
    sync()
    document.addEventListener('visibilitychange', sync)
    reducedMotion.addEventListener('change', sync)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
      reducedMotion.removeEventListener('change', sync)
    }
  }, [])
}

export { ROTATION_INTERVAL_MS, useRotatingFaviconViewModel }
