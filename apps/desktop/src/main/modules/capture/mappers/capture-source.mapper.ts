import type { CaptureSource } from '@gameplay/desktop-bridge'

/** The part of an Electron `NativeImage` the mapper reads, so a spec needs no Electron. */
type ImageLike = { isEmpty(): boolean; toJPEG(quality: number): Buffer; toDataURL(): string }
type SourceLike = { id: string; name: string; thumbnail: ImageLike; appIcon: ImageLike | null }

const THUMBNAIL_QUALITY = 70
/** The bridge refuses larger images; an icon that big is dropped rather than failing the whole list. */
const MAX_IMAGE_CHARS = 200_000

function iconOf(image: ImageLike | null): string | null {
  if (!image || image.isEmpty()) return null
  const url = image.toDataURL()
  return url.length <= MAX_IMAGE_CHARS ? url : null
}

function thumbnailOf(image: ImageLike): string | null {
  if (image.isEmpty()) return null
  const url = `data:image/jpeg;base64,${image.toJPEG(THUMBNAIL_QUALITY).toString('base64')}`
  return url.length <= MAX_IMAGE_CHARS ? url : null
}

/** A source of `desktopCapturer` as the page gets it: kind from the id, images as data URLs. */
export function toCaptureSource(source: SourceLike): CaptureSource {
  return {
    id: source.id,
    name: source.name,
    kind: source.id.startsWith('screen:') ? 'screen' : 'window',
    thumbnail: thumbnailOf(source.thumbnail),
    appIcon: iconOf(source.appIcon),
  }
}
