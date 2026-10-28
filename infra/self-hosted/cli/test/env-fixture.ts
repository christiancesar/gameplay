import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EnvTarget } from '../env-layout.ts'
import { API_EXAMPLE, HOST_EXAMPLE, WEB_EXAMPLE } from './env-seed.ts'
import type { TemporaryDir } from './temporary-dir.ts'

const EXAMPLES: Record<EnvTarget, string> = { host: HOST_EXAMPLE, api: API_EXAMPLE, web: WEB_EXAMPLE }
const NAMES: Record<EnvTarget, string> = { host: '.env', api: '.env.api', web: '.env.web' }

/**
 * A directory with the three examples and, for the files given, what each already holds. `paths` of a file that
 * was not given point at nothing yet.
 */
export function envFixture(temporary: TemporaryDir, current: Partial<Record<EnvTarget, string>> = {}) {
  const dir = temporary.dir()
  const paths = { host: join(dir, NAMES.host), api: join(dir, NAMES.api), web: join(dir, NAMES.web) }
  const examples = {
    host: join(dir, `${NAMES.host}.example`),
    api: join(dir, `${NAMES.api}.example`),
    web: join(dir, `${NAMES.web}.example`),
  }
  for (const target of Object.keys(EXAMPLES) as EnvTarget[]) {
    writeFileSync(examples[target], EXAMPLES[target])
    const contents = current[target]
    if (contents !== undefined) writeFileSync(paths[target], contents)
  }
  return { paths, examples }
}
