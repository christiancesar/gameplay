import { readFileSync, renameSync, writeFileSync } from 'node:fs'

/**
 * The KEY=value lines of a .env file. Values are kept raw (no quotes), as
 * docker compose reads them. Every write keeps the file private (mode 600).
 */
export class EnvFile {
  readonly path: string

  constructor(path: string) {
    this.path = path
  }

  /** Value of the last KEY= line; '' when the key is missing. */
  get(key: string): string {
    const line = this.lines().findLast((candidate) => candidate.startsWith(`${key}=`))
    return line === undefined ? '' : line.slice(key.length + 1)
  }

  has(key: string): boolean {
    return this.lines().some((line) => line.startsWith(`${key}=`))
  }

  /** Replaces the KEY= line, or appends it. */
  set(key: string, value: string): void {
    let found = false
    const lines = this.lines().map((line) => {
      if (!line.startsWith(`${key}=`)) return line
      found = true
      return `${key}=${value}`
    })
    if (!found) lines.push(`${key}=${value}`)
    this.write(lines)
  }

  /** Renames a key and keeps its value; a non-empty new key wins over the old one. */
  rename(oldKey: string, newKey: string): void {
    if (!this.has(oldKey)) return
    if (!this.get(newKey)) this.set(newKey, this.get(oldKey))
    this.write(this.lines().filter((line) => !line.startsWith(`${oldKey}=`)))
  }

  private lines(): string[] {
    const lines = readFileSync(this.path, 'utf8').split('\n')
    if (lines.at(-1) === '') lines.pop()
    return lines
  }

  private write(lines: string[]): void {
    const temporary = `${this.path}.tmp`
    writeFileSync(temporary, `${lines.join('\n')}\n`, { mode: 0o600 })
    renameSync(temporary, this.path)
  }
}
