import { z } from 'zod'

// The origin of the desktop app's pages (the `app://gameplay` protocol it serves its UI from). The API trusts
// it and answers its calls with CORS and credentials, so the session cookie (which the app makes cross-site)
// works there as on the web.
export const DESKTOP_APP_ORIGIN = 'app://gameplay'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** This machine: where a server may be reached over plain http. */
export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname)
}

/**
 * The origin of a server the desktop app may talk to: exactly an origin (no path, query or hash), https, or http
 * for this machine only. A session cookie must not cross the network in the clear, and the cookie the app
 * makes cross-site is `Secure`, which browsers keep only on https and on loopback.
 */
export function isServerOrigin(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.origin !== value) return false
  return url.protocol === 'https:' || (url.protocol === 'http:' && isLoopbackHost(url.hostname))
}

export const serverOriginSchema = z.string().refine(isServerOrigin, 'Not an origin the app can talk to')
