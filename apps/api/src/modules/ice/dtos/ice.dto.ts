import { iceConfigResponseSchema } from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'

export class IceConfigResponseDto extends createZodDto(iceConfigResponseSchema) {}
