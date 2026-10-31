import { Module } from '@nestjs/common'
import { CommonModule } from './common/common.module'
import { EnvModule } from './env/env.module'
import { LoggerModule } from './lib/logger'
import { PrismaModule } from './lib/prisma'
import { TelemetryModule } from './lib/telemetry.module'
import { AccountsModule } from './modules/accounts/accounts.module'
import { AuthenticationModule } from './modules/auth/authentication.module'
import { IceModule } from './modules/ice/ice.module'
import { HealthModule } from './modules/health/health.module'
import { LimitsModule } from './modules/limits/limits.module'
import { MediaModule } from './modules/media/media.module'
import { ServersModule } from './modules/servers/servers.module'
import { StorageModule } from './modules/storage/storage.module'
import { MembershipsModule } from './modules/memberships/memberships.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module'
import { PublicContentModule } from './modules/public-content/public-content.module'
import { RealtimeModule } from './modules/realtime/realtime.module'
import { RegistrationInvitesModule } from './modules/registration-invites/registration-invites.module'
import { UpdatesModule } from './modules/updates/updates.module'

@Module({
  imports: [
    EnvModule,
    LoggerModule,
    TelemetryModule,
    PrismaModule,
    CommonModule,
    StorageModule,
    AuthenticationModule,
    HealthModule,
    LimitsModule,
    RegistrationInvitesModule,
    AccountsModule,
    IceModule,
    ServersModule,
    MembershipsModule,
    NotificationsModule,
    RealtimeModule,
    MediaModule,
    PlatformAdminModule,
    PublicContentModule,
    UpdatesModule,
  ],
})
export class AppModule {}
