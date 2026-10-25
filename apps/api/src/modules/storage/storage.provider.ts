// Where uploaded files live. The database keeps only the key; the public URL
// is built from it, so switching drivers doesn't touch stored data.
export abstract class StorageProvider {
  abstract put(key: string, body: Buffer, contentType: string): Promise<void>
  // Deleting a key that doesn't exist is not an error.
  abstract delete(key: string): Promise<void>
  abstract publicUrl(key: string): string
}

export function joinPublicUrl(base: string, key: string): string {
  return `${base.replace(/\/+$/, '')}/${key}`
}
