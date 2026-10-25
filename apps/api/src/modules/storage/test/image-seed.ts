import sharp from 'sharp'

type ImageOptions = { format?: 'jpeg' | 'png' | 'webp'; width?: number; height?: number; color?: string }

// A plain image of one color, for the upload and image processing tests.
export function makeImage({ format = 'png', width = 800, height = 600, color = '#c82828' }: ImageOptions = {}) {
  return sharp({ create: { width, height, channels: 3, background: color } })
    .toFormat(format)
    .toBuffer()
}
