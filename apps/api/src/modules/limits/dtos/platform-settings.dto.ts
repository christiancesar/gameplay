import { platformSettingsSchema, publicSettingsSchema, serverLimitsSchema, userLimitsSchema } from '@gameplay/shared'
import { createZodDto } from 'nestjs-zod'

export class PlatformSettingsDto extends createZodDto(platformSettingsSchema) {}
export class PublicSettingsDto extends createZodDto(publicSettingsSchema) {}
export class UserLimitsDto extends createZodDto(userLimitsSchema) {}
export class ServerLimitsDto extends createZodDto(serverLimitsSchema) {}
