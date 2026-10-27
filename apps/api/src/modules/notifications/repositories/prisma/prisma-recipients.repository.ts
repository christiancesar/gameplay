import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../lib/prisma'
import { RecipientsRepository } from '../recipients.repository'

@Injectable()
export class PrismaRecipientsRepository extends RecipientsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async allUserIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({ select: { id: true } })
    return users.map(({ id }) => id)
  }

  async existingUserIds(userIds: string[]): Promise<string[]> {
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } })
    return users.map(({ id }) => id)
  }
}
