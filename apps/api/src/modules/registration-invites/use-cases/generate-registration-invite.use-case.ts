import { Injectable } from '@nestjs/common'
import { REGISTRATION_INVITE_SUFFIX_LENGTH, type RegistrationInviteValidity } from '@gameplay/contracts'
import type { RegistrationInviteRecord } from '../domain/registration-invite'
import { TokenGenerator } from '../providers/token-generator'
import { TokenHasher } from '../providers/token-hasher'
import { RegistrationInvitesRepository } from '../repositories/registration-invites.repository'

const DAY_MS = 24 * 60 * 60 * 1000
const VALIDITY_DAYS: Record<RegistrationInviteValidity, number> = { '1d': 1, '7d': 7, '30d': 30 }

type Input = { validity: RegistrationInviteValidity; createdById: string }
type Output = { key: string; invite: RegistrationInviteRecord }

// The key is returned once and never stored: the database keeps its HMAC and
// the last characters for the list.
@Injectable()
export class GenerateRegistrationInviteUseCase {
  constructor(
    private readonly invites: RegistrationInvitesRepository,
    private readonly generator: TokenGenerator,
    private readonly hasher: TokenHasher,
  ) {}

  async execute({ validity, createdById }: Input): Promise<Output> {
    const key = this.generator.generate()
    const invite = await this.invites.create({
      keyHmac: this.hasher.hash(key),
      keySuffix: key.slice(-REGISTRATION_INVITE_SUFFIX_LENGTH),
      expiresAt: new Date(Date.now() + VALIDITY_DAYS[validity] * DAY_MS),
      createdById,
    })
    return { key, invite }
  }
}
