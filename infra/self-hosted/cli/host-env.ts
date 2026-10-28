import { EnvFile } from './env-file.ts'
import { ENV_TARGETS, type EnvTarget, targetOf } from './env-layout.ts'

/** The three env files read and written as one: a variable always goes to the file that owns it. */
export class HostEnv {
  readonly files: Record<EnvTarget, EnvFile>

  constructor(paths: Record<EnvTarget, string>) {
    this.files = {
      host: new EnvFile(paths.host),
      api: new EnvFile(paths.api),
      web: new EnvFile(paths.web),
    }
  }

  get paths(): string[] {
    return ENV_TARGETS.map((target) => this.files[target].path)
  }

  get(key: string): string {
    return this.fileOf(key).get(key)
  }

  has(key: string): boolean {
    return this.fileOf(key).has(key)
  }

  set(key: string, value: string): void {
    this.fileOf(key).set(key, value)
  }

  /** Every key of the three files; the file that owns a key wins if it shows up in another. */
  values(): Record<string, string> {
    const values: Record<string, string> = {}
    for (const target of ENV_TARGETS) {
      for (const [key, value] of Object.entries(this.files[target].values())) {
        if (!(key in values) || targetOf(key) === target) values[key] = value
      }
    }
    return values
  }

  /** Renames a key of an older .env (they all lived in the host file) and keeps its value. */
  rename(oldKey: string, newKey: string): void {
    const legacy = this.files.host
    if (!legacy.has(oldKey)) return
    if (!this.get(newKey)) this.set(newKey, legacy.get(oldKey))
    legacy.delete(oldKey)
  }

  /**
   * An .env from before the split holds the api and web variables too. Moves each to its own file, keeping a
   * value the new file already has. Returns the names moved.
   */
  moveLegacyKeys(): string[] {
    const moved: string[] = []
    for (const [key, value] of Object.entries(this.files.host.values())) {
      const target = targetOf(key)
      if (target === 'host') continue
      if (value && !this.files[target].get(key)) this.files[target].set(key, value)
      this.files.host.delete(key)
      moved.push(key)
    }
    return moved
  }

  private fileOf(key: string): EnvFile {
    return this.files[targetOf(key)]
  }
}
