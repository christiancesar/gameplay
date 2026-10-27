import { Controller, Module, Post, UploadedFile } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import sharp from 'sharp'
import request from 'supertest'
import { ImageProcessor, imageKey } from '../../src/modules/storage/images/image-processor'
import { StorageProvider } from '../../src/modules/storage/providers/storage/storage.provider'
import { requireImageFile, UploadImage } from '../../src/modules/storage/upload/upload-image.decorator'
import { createTestApp } from '../support/create-test-app'

// Same path the avatar route (BE-08) will take: upload, process, store.
@AllowAnonymous()
@Controller('upload-test')
class UploadTestController {
  constructor(
    private readonly images: ImageProcessor,
    private readonly storage: StorageProvider,
  ) {}

  @Post()
  @UploadImage()
  async upload(@UploadedFile() file: Express.Multer.File | undefined) {
    const image = await this.images.process(requireImageFile(file), 'square256')
    const key = imageKey('avatars', 'test-user', image.body)
    await this.storage.put(key, image.body, image.contentType)
    return { url: this.storage.publicUrl(key) }
  }
}

@Module({ controllers: [UploadTestController] })
class UploadTestModule {}

describe('Image upload (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp({ imports: [UploadTestModule] })
  })

  afterAll(async () => {
    await app.close()
  })

  function upload(body: Buffer, filename: string) {
    return request(app.getHttpServer()).post('/api/upload-test').attach('file', body, filename)
  }

  it('stores the processed image in the local driver and serves it', async () => {
    const png = await sharp({ create: { width: 640, height: 480, channels: 3, background: '#3366ff' } })
      .png()
      .toBuffer()

    const response = await upload(png, 'photo.png')

    expect(response.status).toBe(201)
    expect(response.body.url).toMatch(/^\/uploads\/avatars\/test-user\/[0-9a-f]{16}\.webp$/)
    const served = await request(app.getHttpServer()).get(response.body.url)
    expect(served.status).toBe(200)
    expect(served.headers['content-type']).toBe('image/webp')
    expect((await sharp(served.body as Buffer).metadata()).width).toBe(256)
  })

  it('refuses a file with an image name that is not an image', async () => {
    const response = await upload(Buffer.from('%PDF-1.7 fake'), 'photo.png')

    expect(response.status).toBe(415)
    expect(response.body.error.code).toBe('UNSUPPORTED_IMAGE')
  })

  it('refuses more than 2 MB', async () => {
    const response = await upload(Buffer.alloc(2 * 1024 * 1024 + 1), 'big.png')

    expect(response.status).toBe(413)
  })

  it('asks for the file when the field is missing', async () => {
    const response = await request(app.getHttpServer()).post('/api/upload-test').field('other', 'x')

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('IMAGE_REQUIRED')
  })
})
