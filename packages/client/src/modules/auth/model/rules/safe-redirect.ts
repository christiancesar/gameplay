const FALLBACK_REDIRECT = '/hub'

function hasControlCharacter(value: string): boolean {
  return [...value].some((char) => char.charCodeAt(0) < 0x20)
}

/**
 * Accepts only same-origin paths. `//host` and `/\host` are read by browsers as
 * another origin, so they (and anything not starting with a single `/`) fall back.
 */
function safeRedirect(redirect: string | undefined): string {
  if (!redirect) return FALLBACK_REDIRECT
  if (!redirect.startsWith('/')) return FALLBACK_REDIRECT
  if (redirect.startsWith('//') || redirect.startsWith('/\\')) return FALLBACK_REDIRECT
  if (hasControlCharacter(redirect)) return FALLBACK_REDIRECT
  return redirect
}

export { FALLBACK_REDIRECT, safeRedirect }
