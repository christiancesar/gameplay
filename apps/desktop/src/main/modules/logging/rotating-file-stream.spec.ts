import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { RotatingFileStream } from './rotating-file-stream'

const write = (stream: RotatingFileStream, text: string) =>
  new Promise<void>((resolve, reject) => stream.write(text, (error) => (error ? reject(error) : resolve())))

describe('RotatingFileStream', () => {
  let dir: string
  let file: string

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rotating-log-'))
    file = path.join(dir, 'main.log')
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('appends to what the file already holds', async () => {
    fs.writeFileSync(file, 'before\n')
    const stream = new RotatingFileStream(file, { maxBytes: 1000, keep: 2 })

    await write(stream, 'line\n')

    expect(fs.readFileSync(file, 'utf8')).toBe('before\nline\n')
  })

  it('rotates while it runs, so the log keeps inside its size', async () => {
    const stream = new RotatingFileStream(file, { maxBytes: 20, keep: 2 })

    for (let index = 1; index <= 10; index++) await write(stream, `line ${String(index).padStart(2, '0')}\n`)

    const files = fs.readdirSync(dir).sort()
    expect(files).toEqual(['main.log', 'main.log.1', 'main.log.2'])
    for (const name of files) expect(fs.statSync(path.join(dir, name)).size).toBeLessThanOrEqual(20)
    // The newest lines are in main.log, and what fell past `keep` is gone.
    expect(fs.readFileSync(file, 'utf8')).toContain('line 10')
    expect(fs.readFileSync(path.join(dir, 'main.log.2'), 'utf8')).not.toContain('line 01')
  })

  it('writes a line bigger than the limit instead of losing it', async () => {
    const stream = new RotatingFileStream(file, { maxBytes: 5, keep: 1 })

    await write(stream, 'a line much bigger than the limit\n')

    expect(fs.readFileSync(file, 'utf8')).toBe('a line much bigger than the limit\n')
  })
})
