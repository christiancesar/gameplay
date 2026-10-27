import { sleep } from './shell.ts'

/** Waits up to three minutes for APP_URL/api/health to answer. */
export async function waitForHealth(appUrl: string): Promise<boolean> {
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      const response = await fetch(`${appUrl}/api/health`, { signal: AbortSignal.timeout(5000) })
      if (response.ok) return true
    } catch {
      // Not up yet.
    }
    await sleep(2000)
  }
  return false
}
