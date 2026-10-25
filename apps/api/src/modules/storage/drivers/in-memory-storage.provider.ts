import { joinPublicUrl, StorageProvider } from '../storage.provider'

export class InMemoryStorageProvider extends StorageProvider {
  readonly files = new Map<string, { body: Buffer; contentType: string }>()

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    this.files.set(key, { body, contentType })
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key)
  }

  publicUrl(key: string): string {
    return joinPublicUrl('/uploads', key)
  }
}
