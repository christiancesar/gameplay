import { Injectable } from '@nestjs/common'
import type { RegistrationInviteRecord } from '../domain/registration-invite'
import { RegistrationInvitesRepository } from '../repositories/registration-invites.repository'

// Every key ever generated, newest first; nothing is cleaned up.
@Injectable()
export class ListRegistrationInvitesUseCase {
  constructor(private readonly invites: RegistrationInvitesRepository) {}

  execute(): Promise<RegistrationInviteRecord[]> {
    return this.invites.list()
  }
}
