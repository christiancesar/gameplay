import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { joinPublicUrl, StorageProvider } from '../storage.provider'

// Files in a directory (a Docker volume in production, served by nginx).
export class LocalStorageProvider extends StorageProvider {
  private readonly root: string

  constructor(
    directory: string,
    private readonly publicBaseUrl: string,
  ) {
    super()
    this.root = resolve(directory)
  }

  async put(key: string, body: Buffer): Promise<void> {
    const path = this.pathOf(key)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, body)
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathOf(key), { force: true })
  }

  publicUrl(key: string): string {
    return joinPublicUrl(this.publicBaseUrl, key)
  }

  // Writes, reads back and removes a probe file: catches a full disk or a volume without write access.
  async check(): Promise<void> {
    const probe = `.health/probe-${process.pid}`
    await this.put(probe, Buffer.from('ok'))
    await readFile(this.pathOf(probe))
    await this.delete(probe)
  }

  // Keys are built by the app, but a key must never leave the root.
  private pathOf(key: string): string {
    const path = resolve(this.root, key)
    if (!path.startsWith(this.root + sep)) throw new Error(`Invalid storage key: ${key}`)
    return path
  }
}
