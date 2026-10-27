import { platformSettingsSchema, serverLimitsSchema, userLimitsSchema } from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'

export class PlatformSettingsDto extends createZodDto(platformSettingsSchema) {}
export class UserLimitsDto extends createZodDto(userLimitsSchema) {}
export class ServerLimitsDto extends createZodDto(serverLimitsSchema) {}
