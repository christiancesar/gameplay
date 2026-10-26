import { Ghost, Gamepad2, Dice5, Joystick, Swords, Trophy, type LucideIcon } from 'lucide-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

/** Lucide gaming category. */
const FAVICON_ICONS: readonly LucideIcon[] = [Gamepad2, Joystick, Swords, Dice5, Trophy, Ghost]

// Tailwind emerald-500, the app accent.
const FAVICON_COLOR = '#10b981'

/** Lucide icon as a data URL, ready for `<link rel="icon">`. */
function iconToDataUrl(Icon: LucideIcon, color = FAVICON_COLOR): string {
  const svg = renderToStaticMarkup(createElement(Icon, { color, size: 32, strokeWidth: 2 }))
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Swaps the href of the page's icon link, creating the link when it is missing. */
function setFavicon(href: string, doc: Document = document): void {
  let link = doc.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) {
    link = doc.createElement('link')
    link.rel = 'icon'
    doc.head.appendChild(link)
  }
  link.type = 'image/svg+xml'
  link.href = href
}

export { FAVICON_ICONS, iconToDataUrl, setFavicon }
