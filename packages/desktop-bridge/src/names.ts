/** The channels between the page and the main process. Apart from the schemas so the preload carries no zod. */
export const DESKTOP_CHANNELS = [
  'server:get-url',
  'server:set-url',
  'audio:available',
  'audio:list-apps',
  'audio:share',
  'audio:stop',
] as const

export type DesktopChannel = (typeof DESKTOP_CHANNELS)[number]
