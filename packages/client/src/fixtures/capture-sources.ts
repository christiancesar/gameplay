// Telas e janelas fictícias do seletor de fontes, usadas só nas stories. As miniaturas são SVG em data URL.
import type { ShareSourceOption } from '@/modules/screen-share/views/share-source-picker.view'

const preview = (from: string, to: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/></svg>`,
  )}`

const icon = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" rx="3" fill="${color}"/></svg>`,
  )}`

export const captureSources: ShareSourceOption[] = [
  { id: 'screen:0:0', name: 'Entire screen', kind: 'screen', thumbnail: preview('#334155', '#0f172a'), appIcon: null },
  { id: 'screen:1:0', name: 'Screen 2', kind: 'screen', thumbnail: preview('#1e293b', '#020617'), appIcon: null },
  {
    id: 'window:590528:0',
    name: 'Cyberpunk 2077',
    kind: 'window',
    thumbnail: preview('#be123c', '#4c0519'),
    appIcon: icon('#f43f5e'),
  },
  {
    id: 'window:262794:0',
    name: 'Firefox, a window with a name that is long enough to be cut',
    kind: 'window',
    thumbnail: preview('#0e7490', '#164e63'),
    appIcon: icon('#06b6d4'),
  },
  { id: 'window:99:0', name: 'Notes', kind: 'window', thumbnail: null, appIcon: null },
]
