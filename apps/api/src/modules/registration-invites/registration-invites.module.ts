import { Module } from '@nestjs/common'
import { RegistrationInvitesController } from './controllers/registration-invites.controller'
import { CryptoTokenGenerator } from './providers/token-generator/crypto/crypto.token-generator.provider'
import { TokenGenerator } from './providers/token-generator/token-generator.provider'
import { HmacTokenHasher } from './providers/token-hasher/hmac/hmac.token-hasher.provider'
import { TokenHasher } from './providers/token-hasher/token-hasher.provider'
import { PrismaRegistrationInvitesRepository } from './repositories/prisma/prisma-registration-invites.repository'
import { RegistrationInvitesRepository } from './repositories/registration-invites.repository'
import { ConsumeRegistrationInviteUseCase } from './use-cases/consume-registration-invite.use-case'
import { GenerateRegistrationInviteUseCase } from './use-cases/generate-registration-invite.use-case'
import { ListRegistrationInvitesUseCase } from './use-cases/list-registration-invites.use-case'
import { RevokeRegistrationInviteUseCase } from './use-cases/revoke-registration-invite.use-case'
import { SettleRegistrationInviteUseCase } from './use-cases/settle-registration-invite.use-case'

// Registration keys: the admin generates, lists and revokes them; the sign-up
// hook consumes them.
@Module({
  controllers: [RegistrationInvitesController],
  providers: [
    { provide: RegistrationInvitesRepository, useClass: PrismaRegistrationInvitesRepository },
    { provide: TokenGenerator, useClass: CryptoTokenGenerator },
    { provide: TokenHasher, useClass: HmacTokenHasher },
    GenerateRegistrationInviteUseCase,
    ListRegistrationInvitesUseCase,
    RevokeRegistrationInviteUseCase,
    ConsumeRegistrationInviteUseCase,
    SettleRegistrationInviteUseCase,
  ],
  exports: [ConsumeRegistrationInviteUseCase, SettleRegistrationInviteUseCase],
})
export class RegistrationInvitesModule {}
