import { CreateBucketCommand, GetObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3'
import { S3StorageProvider } from '../../src/modules/storage/drivers/s3-storage.provider'

// Runs against the S3 mock (adobe/s3mock) from infra/docker-compose.dev.yml.
const endpoint = process.env.S3_TEST_ENDPOINT as string
const credentials = { accessKeyId: 'test', secretAccessKey: 'test' }
const bucket = 'gameplay-e2e'

describe('S3StorageProvider (e2e)', () => {
  const client = new S3Client({ region: 'us-east-1', endpoint, forcePathStyle: true, credentials })
  const storage = new S3StorageProvider({
    bucket,
    region: 'us-east-1',
    endpoint,
    forcePathStyle: true,
    ...credentials,
    publicBaseUrl: 'https://cdn.example.com/',
  })

  beforeAll(async () => {
    await client.send(new CreateBucketCommand({ Bucket: bucket })).catch((error: { name?: string }) => {
      if (error.name !== 'BucketAlreadyOwnedByYou' && error.name !== 'BucketAlreadyExists') throw error
    })
  })

  afterAll(() => client.destroy())

  it('puts an object with its type and cache header, then deletes it', async () => {
    const key = `avatars/u1/${Date.now()}.webp`

    await storage.put(key, Buffer.from('webp-bytes'), 'image/webp')

    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    expect(object.ContentType).toBe('image/webp')
    expect(object.CacheControl).toBe('public, max-age=31536000, immutable')
    expect(await object.Body?.transformToString()).toBe('webp-bytes')

    await storage.delete(key)
    await expect(client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))).rejects.toBeInstanceOf(NoSuchKey)
  })

  it('passes the check on a reachable bucket and fails on a missing one', async () => {
    await expect(storage.check()).resolves.toBeUndefined()

    const missing = new S3StorageProvider({
      bucket: 'gameplay-e2e-missing',
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      ...credentials,
      publicBaseUrl: '/',
    })
    await expect(missing.check()).rejects.toThrow()
  })

  it('builds the public URL from the bucket or CDN base', () => {
    expect(storage.publicUrl('covers/s1/abc.webp')).toBe('https://cdn.example.com/covers/s1/abc.webp')
  })
})
