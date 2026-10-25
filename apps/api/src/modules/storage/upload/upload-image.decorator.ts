import { applyDecorators, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiPayloadTooLargeResponse, ApiUnsupportedMediaTypeResponse } from '@nestjs/swagger'
import { memoryStorage } from 'multer'
import { IMAGE_MAX_BYTES } from '../images/image-processor'
import { ImageRequiredError } from '../images/image.errors'

export const IMAGE_FIELD = 'file'

// Multipart route with one image in the "file" field, kept in memory for the
// ImageProcessor. Multer stops reading past 2 MB (413).
export function UploadImage() {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(IMAGE_FIELD, { storage: memoryStorage(), limits: { fileSize: IMAGE_MAX_BYTES, files: 1 } }),
    ),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: [IMAGE_FIELD],
        properties: {
          [IMAGE_FIELD]: { type: 'string', format: 'binary', description: 'JPG, PNG or WebP, up to 2 MB' },
        },
      },
    }),
    ApiPayloadTooLargeResponse({ description: 'Image larger than 2 MB' }),
    ApiUnsupportedMediaTypeResponse({ description: 'Not a JPG, PNG or WebP image' }),
  )
}

// For @UploadedFile(): the field may be missing from the form.
export function requireImageFile(file: Express.Multer.File | undefined): Buffer {
  if (!file) throw new ImageRequiredError()
  return file.buffer
}
