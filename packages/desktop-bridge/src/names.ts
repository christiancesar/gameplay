/** The channels between the page and the main process. Apart from the schemas so the preload carries no zod. */
export const DESKTOP_CHANNELS = ['server:get-url', 'server:set-url'] as const

export type DesktopChannel = (typeof DESKTOP_CHANNELS)[number]
