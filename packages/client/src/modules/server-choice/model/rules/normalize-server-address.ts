const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * The origin of the server a user typed: "play.example.com" becomes `https://play.example.com`, and a path,
 * query or hash is dropped. Plain `http` is for this machine only (`localhost` and loopback), because a session
 * must not cross the network in the clear. Null when it is not an address the app can talk to.
 */
function normalizeServerAddress(input: string): string | null {
  const typed = input.trim()
  if (!typed) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(typed)
    ? typed
    : `${isLoopback(typed) ? 'http' : 'https'}://${typed}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.protocol === 'http:' && !LOOPBACK_HOSTS.has(url.hostname)) return null
  return url.origin
}

function isLoopback(typed: string): boolean {
  const host = typed.replace(/[/?#].*$/, '').replace(/:\d+$/, '')
  return LOOPBACK_HOSTS.has(host)
}

export { normalizeServerAddress }
