import { Module } from '@nestjs/common'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { EnvService } from '../../env/env.service'
import { createAuth } from '../../lib/auth'
import { PrismaService } from '../../lib/prisma'
import { RegistrationInvitesModule } from '../registration-invites/registration-invites.module'
import { SignUpHook } from './hooks/sign-up.hook'
import { UpdateUserHook } from './hooks/update-user.hook'

// Mounts Better Auth on /api/auth and registers its global AuthGuard: every
// route needs a session unless marked with @AllowAnonymous().
@Module({
  imports: [
    AuthModule.forRootAsync({
      inject: [PrismaService, EnvService],
      useFactory: (prisma: PrismaService, env: EnvService) => ({ auth: createAuth(prisma, env) }),
    }),
    RegistrationInvitesModule,
  ],
  providers: [SignUpHook, UpdateUserHook],
})
export class AuthenticationModule {}
