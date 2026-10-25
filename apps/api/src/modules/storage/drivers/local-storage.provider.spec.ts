import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { StorageProvider } from '../storage.provider'
import { LocalStorageProvider } from './local-storage.provider'

describe('LocalStorageProvider', () => {
  let directory: string
  let storage: StorageProvider

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'gameplay-storage-'))
    storage = new LocalStorageProvider(directory, '/uploads/')
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('writes, serves and deletes a file', async () => {
    await storage.put('avatars/u1/abc.webp', Buffer.from('image'), 'image/webp')

    expect(await readFile(join(directory, 'avatars/u1/abc.webp'), 'utf8')).toBe('image')
    expect(storage.publicUrl('avatars/u1/abc.webp')).toBe('/uploads/avatars/u1/abc.webp')

    await storage.delete('avatars/u1/abc.webp')
    await expect(readFile(join(directory, 'avatars/u1/abc.webp'))).rejects.toThrow()
  })

  it('ignores deleting a missing file', async () => {
    await expect(storage.delete('avatars/u1/missing.webp')).resolves.toBeUndefined()
  })

  it('refuses a key that leaves the directory', async () => {
    await expect(storage.put('../outside.webp', Buffer.from('x'), 'image/webp')).rejects.toThrow(/Invalid storage key/)
  })
})
