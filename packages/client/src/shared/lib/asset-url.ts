import { currentPlatform } from '@/shared/platform/current-platform'

/** Resolves server-owned relative assets for hosts whose page and API have different origins. */
function assetUrl(source: string): string {
  if (!source.startsWith('/')) return source

  try {
    const baseUrl = currentPlatform().server.baseUrl()
    return baseUrl ? new URL(source, `${baseUrl}/`).toString() : source
  } catch {
    // Storybook and isolated views do not mount a platform. The browser can resolve the path itself there.
    return source
  }
}

export { assetUrl }
