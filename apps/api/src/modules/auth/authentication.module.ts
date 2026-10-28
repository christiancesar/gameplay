import { Module } from '@nestjs/common'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { EnvService } from '../../env/env.service'
import { createAuth } from '../../lib/auth'
import { PrismaService } from '../../lib/prisma'
import { MembershipsModule } from '../memberships/memberships.module'
import { RegistrationInvitesModule } from '../registration-invites/registration-invites.module'
import { SignUpHook } from './hooks/sign-up.hook'
import { UpdateUserHook } from './hooks/update-user.hook'

// Mounts Better Auth on /api/auth and registers its global AuthGuard: every
// route needs a session unless marked with @AllowAnonymous().
@Module({
  imports: [
    AuthModule.forRootAsync({
      inject: [PrismaService, EnvService],
      // CORS is set in setupApp: the module's own one has no PATCH.
      useFactory: (prisma: PrismaService, env: EnvService) => ({
        auth: createAuth(prisma, env),
        disableTrustedOriginsCors: true,
      }),
    }),
    RegistrationInvitesModule,
    MembershipsModule,
  ],
  providers: [SignUpHook, UpdateUserHook],
})
export class AuthenticationModule {}
