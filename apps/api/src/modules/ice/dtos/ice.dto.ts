import { iceConfigResponseSchema } from '@gameplay/shared'
import { createZodDto } from 'nestjs-zod'

export class IceConfigResponseDto extends createZodDto(iceConfigResponseSchema) {}
