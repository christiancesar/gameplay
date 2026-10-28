import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createLoggingModule } from './logging.module'

describe('createLoggingModule', () => {
  let dir: string

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logging-module-'))
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('writes JSON lines from info up, with the level as a word', () => {
    const { logger, file } = createLoggingModule({ dir, echo: false })

    logger.debug({ hidden: true }, 'debug stays out')
    logger.info({ answer: 42 }, 'hello')

    const lines = fs.readFileSync(file, 'utf8').trim().split('\n')
    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0] ?? '')).toMatchObject({ level: 'info', msg: 'hello', answer: 42 })
  })

  it('keeps the disk it takes inside a limit however much the app logs', () => {
    const { logger, file } = createLoggingModule({ dir: path.join(dir, 'logs'), echo: false })
    const big = 'x'.repeat(400)

    // About 40 MB, against a limit of 5 MB for each of the four files.
    for (let index = 0; index < 90_000; index++) logger.error({ index, big }, 'flood')
    logger.info('last line')

    const files = fs.readdirSync(path.dirname(file))
    const total = files.reduce((sum, name) => sum + fs.statSync(path.join(path.dirname(file), name)).size, 0)
    expect(files.length).toBeGreaterThan(1)
    expect(files.length).toBeLessThanOrEqual(4)
    expect(total).toBeLessThanOrEqual(4 * 5 * 1024 * 1024)
    expect(fs.readFileSync(file, 'utf8')).toContain('last line')
  })
})
