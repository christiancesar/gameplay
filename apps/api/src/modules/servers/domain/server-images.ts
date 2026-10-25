export type ServerImageKind = 'icon' | 'cover'

// Icon: square 256. Cover: 16:9 1280x720.
export const SERVER_IMAGES = {
  icon: { profile: 'square256', folder: 'icons', field: 'iconKey' },
  cover: { profile: 'cover1280x720', folder: 'covers', field: 'coverKey' },
} as const
