import { isLoopbackHost, isServerOrigin } from '@gameplay/contracts'

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
  let origin: string
  try {
    origin = new URL(withScheme).origin
  } catch {
    return null
  }
  return isServerOrigin(origin) ? origin : null
}

/** A bare `localhost:8080` or `127.0.0.1` is this machine: the scheme left out means http. */
function isLoopback(typed: string): boolean {
  const host = typed.replace(/[/?#].*$/, '').replace(/:\d+$/, '')
  return isLoopbackHost(host)
}

export { normalizeServerAddress }
