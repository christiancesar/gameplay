import { Injectable } from '@nestjs/common'
import type { Prisma } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import type { RegistrationInviteRecord } from '../../domain/registration-invite'
import { type CreateRegistrationInviteData, RegistrationInvitesRepository } from '../registration-invites.repository'

const select = {
  id: true,
  keySuffix: true,
  createdAt: true,
  expiresAt: true,
  revokedAt: true,
  usedAt: true,
  createdById: true,
  usedBy: { select: { id: true, username: true } },
} satisfies Prisma.RegistrationInviteSelect

type Row = Prisma.RegistrationInviteGetPayload<{ select: typeof select }>

function toRecord({ usedBy, ...row }: Row): RegistrationInviteRecord {
  return { ...row, usedBy: usedBy ? { id: usedBy.id, username: usedBy.username ?? '' } : null }
}

@Injectable()
export class PrismaRegistrationInvitesRepository extends RegistrationInvitesRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async create(data: CreateRegistrationInviteData): Promise<RegistrationInviteRecord> {
    return toRecord(await this.prisma.registrationInvite.create({ data, select }))
  }

  async list(): Promise<RegistrationInviteRecord[]> {
    const rows = await this.prisma.registrationInvite.findMany({ select, orderBy: { createdAt: 'desc' } })
    return rows.map(toRecord)
  }

  async findById(id: string): Promise<RegistrationInviteRecord | null> {
    const row = await this.prisma.registrationInvite.findUnique({ where: { id }, select })
    return row && toRecord(row)
  }

  async revoke(id: string, now: Date): Promise<boolean> {
    const { count } = await this.prisma.registrationInvite.updateMany({
      where: { id, usedAt: null, revokedAt: null },
      data: { revokedAt: now },
    })
    return count === 1
  }

  async take(keyHmac: string, now: Date): Promise<boolean> {
    // A single conditional UPDATE: the row lock makes the second sign-up see
    // usedAt already set and change nothing.
    const { count } = await this.prisma.registrationInvite.updateMany({
      where: { keyHmac, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    })
    return count === 1
  }

  async assignUser(keyHmac: string, userId: string): Promise<void> {
    await this.prisma.registrationInvite.updateMany({
      where: { keyHmac, usedAt: { not: null }, usedById: null },
      data: { usedById: userId },
    })
  }

  async release(keyHmac: string): Promise<void> {
    await this.prisma.registrationInvite.updateMany({
      where: { keyHmac, usedById: null },
      data: { usedAt: null },
    })
  }
}
