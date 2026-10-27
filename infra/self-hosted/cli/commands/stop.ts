import { existsSync } from 'node:fs'
import { ALL_PROFILES, compose } from '../compose.ts'
import { ENV_FILE } from '../paths.ts'

/**
 * Stops the stack and the tunnel. Data (database, uploads) is kept. To wipe
 * everything too: docker compose --project-directory infra/self-hosted
 * --profile quick --profile named --profile token down -v
 */
export function stop(): void {
  if (!existsSync(ENV_FILE)) {
    console.log(`No ${ENV_FILE}, nothing was started from here.`)
    return
  }
  compose([...ALL_PROFILES, 'down'])
  console.log('Stopped. The public link no longer works; data volumes were kept.')
}
