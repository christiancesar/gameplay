import type { Session } from 'electron'

/**
 * The same cookie, made to travel between sites. The page of the app (`app://gameplay`) and the server it
 * talks to are different sites, so a `SameSite=Lax` cookie of the server never comes back. Browsers keep
 * `SameSite=None` only with `Secure`, which Chromium also grants to `localhost` over plain http.
 */
function toCrossSiteCookie(setCookie: string): string {
  const attributes = setCookie
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part !== '' && !/^samesite=/i.test(part) && !/^secure$/i.test(part))
  return [...attributes, 'SameSite=None', 'Secure'].join('; ')
}

type Headers = Record<string, string[]>

/** The response headers with every `Set-Cookie` made cross-site; the others are untouched. */
function withCrossSiteCookies(headers: Headers): Headers {
  const name = Object.keys(headers).find((key) => key.toLowerCase() === 'set-cookie')
  return name ? { ...headers, [name]: headers[name].map(toCrossSiteCookie) } : headers
}

/** Rewrites the cookies of every answer that does not come from the app itself. */
function installCookiePolicy(session: Session, isFromApp: (url: string) => boolean): void {
  session.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders as Headers | undefined
    callback({ responseHeaders: headers && !isFromApp(details.url) ? withCrossSiteCookies(headers) : headers })
  })
}

export { installCookiePolicy, toCrossSiteCookie, withCrossSiteCookies }
