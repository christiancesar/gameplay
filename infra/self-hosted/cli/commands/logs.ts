import { ALL_PROFILES, compose } from '../compose.ts'

/** Follows the logs of every service, tunnel included, until Ctrl+C. */
export function logs(): void {
  try {
    compose([...ALL_PROFILES, 'logs', '-f', '--tail', '100'])
  } catch {
    // Ctrl+C ends `logs -f` with a non-zero status.
  }
}
