import { Module } from '@nestjs/common'
import { AccountsModule } from '../accounts/accounts.module'
import { LimitsModule } from '../limits/limits.module'
import { MembershipsModule } from '../memberships/memberships.module'
import { RealtimeModule } from '../realtime/realtime.module'
import { ServersModule } from '../servers/servers.module'
import { AdminHardwareController } from './controllers/admin-hardware.controller'
import { AdminServersController } from './controllers/admin-servers.controller'
import { AdminUsersController } from './controllers/admin-users.controller'
import { AuthAccounts } from './providers/auth-accounts/auth-accounts.provider'
import { BetterAuthAccounts } from './providers/auth-accounts/better-auth/better-auth.auth-accounts.provider'
import { CryptoPasswordGenerator } from './providers/password-generator/crypto/crypto.password-generator.provider'
import { PasswordGenerator } from './providers/password-generator/password-generator.provider'
import { AdminDevicesRepository } from './repositories/admin-devices.repository'
import { AdminServersRepository } from './repositories/admin-servers.repository'
import { AdminUsersRepository } from './repositories/admin-users.repository'
import { PrismaAdminDevicesRepository } from './repositories/prisma/prisma-admin-devices.repository'
import { PrismaAdminServersRepository } from './repositories/prisma/prisma-admin-servers.repository'
import { PrismaAdminUsersRepository } from './repositories/prisma/prisma-admin-users.repository'
import { AdminServerViewsService } from './services/admin-server-views.service'
import { AdminUsersService } from './services/admin-users.service'
import { AdminDeleteServerUseCase } from './use-cases/admin-delete-server.use-case'
import { GetHardwareSummaryUseCase } from './use-cases/get-hardware-summary.use-case'
import { GetServerDetailUseCase } from './use-cases/get-server-detail.use-case'
import { GetUserDevicesUseCase } from './use-cases/get-user-devices.use-case'
import { ListDevicesUseCase } from './use-cases/list-devices.use-case'
import { ListServersUseCase } from './use-cases/list-servers.use-case'
import { ListUserSessionsUseCase } from './use-cases/list-user-sessions.use-case'
import { ListUsersUseCase } from './use-cases/list-users.use-case'
import { ReactivateUserUseCase } from './use-cases/reactivate-user.use-case'
import { ResetUserPasswordUseCase } from './use-cases/reset-user-password.use-case'
import { RevokeUserSessionUseCase } from './use-cases/revoke-user-session.use-case'
import { RevokeUserSessionsUseCase } from './use-cases/revoke-user-sessions.use-case'
import { SuspendUserUseCase } from './use-cases/suspend-user.use-case'

// The platform admin panel: users with presence and sessions, suspension,
// password reset, any server, and the hardware of the base. Every route needs
// role admin and two-factor (@PlatformAdmin). Keys and limits have their own
// modules.
@Module({
  imports: [AccountsModule, LimitsModule, MembershipsModule, RealtimeModule, ServersModule],
  controllers: [AdminUsersController, AdminServersController, AdminHardwareController],
  providers: [
    { provide: AdminUsersRepository, useClass: PrismaAdminUsersRepository },
    { provide: AdminServersRepository, useClass: PrismaAdminServersRepository },
    { provide: AdminDevicesRepository, useClass: PrismaAdminDevicesRepository },
    { provide: AuthAccounts, useClass: BetterAuthAccounts },
    { provide: PasswordGenerator, useClass: CryptoPasswordGenerator },
    AdminUsersService,
    AdminServerViewsService,
    ListUsersUseCase,
    ListUserSessionsUseCase,
    RevokeUserSessionsUseCase,
    RevokeUserSessionUseCase,
    SuspendUserUseCase,
    ReactivateUserUseCase,
    ResetUserPasswordUseCase,
    GetUserDevicesUseCase,
    ListServersUseCase,
    GetServerDetailUseCase,
    AdminDeleteServerUseCase,
    GetHardwareSummaryUseCase,
    ListDevicesUseCase,
  ],
})
export class PlatformAdminModule {}
