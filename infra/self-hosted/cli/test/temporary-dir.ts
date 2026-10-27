import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach } from 'vitest'

/** A fresh directory per test, removed afterwards; `file` writes a file into it. */
export function useTemporaryDir() {
  const dirs: string[] = []
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })
  return {
    path(name: string): string {
      const dir = mkdtempSync(join(tmpdir(), 'gameplay-host-'))
      dirs.push(dir)
      return join(dir, name)
    },
    file(name: string, contents: string): string {
      const path = this.path(name)
      writeFileSync(path, contents)
      return path
    },
  }
}
