import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { joinPublicUrl, StorageProvider } from '../storage.provider'

export type S3StorageOptions = {
  bucket: string
  region: string
  endpoint?: string
  forcePathStyle: boolean
  accessKeyId: string
  secretAccessKey: string
  publicBaseUrl: string
}

// Any S3-compatible bucket (AWS, Cloudflare R2). Keys carry a content hash,
// so objects never change and can be cached for good.
export class S3StorageProvider extends StorageProvider {
  private readonly client: S3Client

  constructor(private readonly options: S3StorageOptions) {
    super()
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
      credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    })
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key }))
  }

  publicUrl(key: string): string {
    return joinPublicUrl(this.options.publicBaseUrl, key)
  }
}
