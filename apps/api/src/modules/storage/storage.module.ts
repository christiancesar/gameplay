import { Global, Module } from '@nestjs/common'
import { EnvService } from '../../env/env.service'
import { LocalStorageProvider } from './providers/storage/local/local.storage.provider'
import { S3StorageProvider } from './providers/storage/s3/s3.storage.provider'
import { ImageProcessor } from './images/image-processor'
import { StorageProvider } from './providers/storage/storage.provider'

function createStorage(env: EnvService): StorageProvider {
  const publicBaseUrl = env.get('PUBLIC_UPLOADS_URL')
  if (env.get('STORAGE_DRIVER') === 'local') {
    return new LocalStorageProvider(env.get('STORAGE_LOCAL_DIR'), publicBaseUrl)
  }
  // The env schema requires these for the s3 driver.
  return new S3StorageProvider({
    bucket: env.get('S3_BUCKET') as string,
    region: env.get('S3_REGION'),
    endpoint: env.get('S3_ENDPOINT'),
    forcePathStyle: env.get('S3_FORCE_PATH_STYLE'),
    accessKeyId: env.get('S3_ACCESS_KEY_ID') as string,
    secretAccessKey: env.get('S3_SECRET_ACCESS_KEY') as string,
    publicBaseUrl,
  })
}

// Uploaded images: the driver picked by STORAGE_DRIVER and the processor.
@Global()
@Module({
  providers: [{ provide: StorageProvider, inject: [EnvService], useFactory: createStorage }, ImageProcessor],
  exports: [StorageProvider, ImageProcessor],
})
export class StorageModule {}
