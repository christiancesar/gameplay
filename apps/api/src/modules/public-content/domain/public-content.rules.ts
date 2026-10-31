import type { PublicContentVisibility } from '@gameplay/contracts'

function publishedAtFor(
  visibility: PublicContentVisibility,
  supplied?: string | null,
  current?: Date | null,
): Date | null {
  if (supplied !== undefined) return supplied ? new Date(supplied) : null
  if (visibility === 'published') return current ?? new Date()
  return null
}

export { publishedAtFor }
