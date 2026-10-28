import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { serverOriginSchema } from '@gameplay/contracts'

import { ServerAddressProvider } from '../server-address.provider'

/** A small JSON file in the data folder of the app. */
export class FileServerAddressProvider extends ServerAddressProvider {
  private readonly file: string

  constructor(file: string) {
    super()
    this.file = file
  }

  async read(): Promise<string | null> {
    try {
      const { url } = JSON.parse(await readFile(this.file, 'utf8')) as { url?: unknown }
      const parsed = serverOriginSchema.safeParse(url)
      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  }

  async write(origin: string): Promise<void> {
    await mkdir(path.dirname(this.file), { recursive: true })
    await writeFile(this.file, JSON.stringify({ url: origin }), 'utf8')
  }
}
