import { platformSettingsSchema, publicSettingsSchema, userLimitsSchema } from '@gameplay/shared'
import { createZodDto } from 'nestjs-zod'

export class PlatformSettingsDto extends createZodDto(platformSettingsSchema) {}
export class PublicSettingsDto extends createZodDto(publicSettingsSchema) {}
export class UserLimitsDto extends createZodDto(userLimitsSchema) {}
