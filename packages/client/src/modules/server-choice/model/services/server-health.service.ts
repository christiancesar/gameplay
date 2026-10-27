type ServerCheck = 'ok' | 'unreachable' | 'notGameplay'

const TIMEOUT_MS = 8000

/**
 * Asks the server at `origin` whether it is a Gameplay API that answers this app. It goes straight to the
 * origin (not through `http`, which only knows the server once one is chosen).
 */
async function checkServer(origin: string, doFetch: typeof fetch = fetch): Promise<ServerCheck> {
  try {
    const response = await doFetch(`${origin}/api/health`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    const body: unknown = await response.json().catch(() => null)
    const isGameplay = response.ok && typeof body === 'object' && body !== null && 'status' in body
    return isGameplay ? 'ok' : 'notGameplay'
  } catch {
    // No answer, a refused connection, or a server that does not let this app call it (CORS).
    return 'unreachable'
  }
}

export { checkServer }
export type { ServerCheck }
