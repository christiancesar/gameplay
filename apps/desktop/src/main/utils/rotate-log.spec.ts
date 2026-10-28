import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { rotateLog } from './rotate-log'

describe('rotateLog', () => {
  let dir: string
  let file: string

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rotate-log-'))
    file = path.join(dir, 'main.log')
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('leaves a small log, and a missing one, alone', () => {
    rotateLog(file, { maxBytes: 10, keep: 3 })
    fs.writeFileSync(file, 'tiny')

    rotateLog(file, { maxBytes: 10, keep: 3 })

    expect(fs.readdirSync(dir)).toEqual(['main.log'])
  })

  it('moves a big log to .1 and pushes the older ones up, dropping what passes `keep`', () => {
    fs.writeFileSync(file, 'current log, too big')
    fs.writeFileSync(`${file}.1`, 'one')
    fs.writeFileSync(`${file}.2`, 'two')

    rotateLog(file, { maxBytes: 10, keep: 2 })

    expect(fs.existsSync(file)).toBe(false)
    expect(fs.readFileSync(`${file}.1`, 'utf8')).toBe('current log, too big')
    expect(fs.readFileSync(`${file}.2`, 'utf8')).toBe('one')
    expect(fs.existsSync(`${file}.3`)).toBe(false)
  })
})
