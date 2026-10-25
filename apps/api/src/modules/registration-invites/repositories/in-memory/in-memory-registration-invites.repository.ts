import type { RegistrationInviteRecord } from '../../domain/registration-invite'
import { type CreateRegistrationInviteData, RegistrationInvitesRepository } from '../registration-invites.repository'

type StoredInvite = Omit<RegistrationInviteRecord, 'usedBy'> & { keyHmac: string; usedById: string | null }

export class InMemoryRegistrationInvitesRepository extends RegistrationInvitesRepository {
  readonly items: StoredInvite[] = []
  // userId -> username, to fill usedBy.
  readonly usernames = new Map<string, string>()
  private sequence = 0

  async create(data: CreateRegistrationInviteData): Promise<RegistrationInviteRecord> {
    this.sequence += 1
    const item: StoredInvite = {
      ...data,
      id: `invite-${this.sequence}`,
      createdAt: new Date(),
      revokedAt: null,
      usedAt: null,
      usedById: null,
    }
    this.items.push(item)
    return this.toRecord(item)
  }

  async list(): Promise<RegistrationInviteRecord[]> {
    return [...this.items].reverse().map((item) => this.toRecord(item))
  }

  async findById(id: string): Promise<RegistrationInviteRecord | null> {
    const item = this.items.find((invite) => invite.id === id)
    return item ? this.toRecord(item) : null
  }

  async revoke(id: string, now: Date): Promise<boolean> {
    const item = this.items.find((invite) => invite.id === id && !invite.usedAt && !invite.revokedAt)
    if (!item) return false
    item.revokedAt = now
    return true
  }

  async take(keyHmac: string, now: Date): Promise<boolean> {
    const item = this.items.find(
      (invite) => invite.keyHmac === keyHmac && !invite.usedAt && !invite.revokedAt && invite.expiresAt > now,
    )
    if (!item) return false
    item.usedAt = now
    return true
  }

  async assignUser(keyHmac: string, userId: string): Promise<void> {
    const item = this.items.find((invite) => invite.keyHmac === keyHmac && invite.usedAt && !invite.usedById)
    if (item) item.usedById = userId
  }

  async release(keyHmac: string): Promise<void> {
    const item = this.items.find((invite) => invite.keyHmac === keyHmac && !invite.usedById)
    if (item) item.usedAt = null
  }

  private toRecord({ keyHmac: _keyHmac, usedById, ...item }: StoredInvite): RegistrationInviteRecord {
    return { ...item, usedBy: usedById ? { id: usedById, username: this.usernames.get(usedById) ?? '' } : null }
  }
}
