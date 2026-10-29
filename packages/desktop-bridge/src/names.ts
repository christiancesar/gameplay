/** The channels between the page and the main process. Apart from the schemas so the preload carries no zod. */
export const DESKTOP_CHANNELS = [
  'server:get-url',
  'server:set-url',
  'audio:available',
  'audio:list-apps',
  'audio:share',
  'audio:stop',
  'capture:can-list',
  'capture:list-sources',
  'capture:select-source',
  'system-audio:available',
  'system-audio:start',
  'system-audio:stop',
  'diagnostics:record',
  'diagnostics:is-enabled',
] as const

export type DesktopChannel = (typeof DESKTOP_CHANNELS)[number]

/** What the main process sends to the page on its own, with no call before it. */
export const DESKTOP_EVENTS = ['system-audio:pcm'] as const

export type DesktopEvent = (typeof DESKTOP_EVENTS)[number]
