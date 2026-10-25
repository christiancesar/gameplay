import { Injectable } from '@nestjs/common'
import type { Prisma } from '../../../../generated/prisma/client'
import { PrismaService } from '../../../../lib/prisma'
import type { RoomRecord } from '../../domain/server'
import { RoomsRepository, type RoomsGuard } from '../rooms.repository'

const select = { id: true, serverId: true, name: true, position: true } as const

type Tx = Prisma.TransactionClient

@Injectable()
export class PrismaRoomsRepository extends RoomsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  list(serverId: string): Promise<RoomRecord[]> {
    return listRooms(this.prisma, serverId)
  }

  create(serverId: string, name: string, guard: RoomsGuard): Promise<RoomRecord> {
    return this.locked(serverId, guard, async (tx, rooms) => {
      const position = Math.max(-1, ...rooms.map((room) => room.position)) + 1
      return tx.room.create({ data: { serverId, name, position }, select })
    })
  }

  rename(serverId: string, roomId: string, name: string, guard: RoomsGuard): Promise<RoomRecord> {
    return this.locked(serverId, guard, (tx) =>
      tx.room.update({ where: { id: roomId, serverId }, data: { name }, select }),
    )
  }

  async delete(serverId: string, roomId: string): Promise<void> {
    await this.prisma.room.deleteMany({ where: { id: roomId, serverId } })
  }

  reorder(serverId: string, roomIds: string[], guard: RoomsGuard): Promise<RoomRecord[]> {
    return this.locked(serverId, guard, async (tx) => {
      for (const [position, id] of roomIds.entries()) {
        await tx.room.update({ where: { id, serverId }, data: { position } })
      }
      return listRooms(tx, serverId)
    })
  }

  // Concurrent room changes of one server wait for each other here, so the
  // limit and the unique name hold.
  private locked<T>(serverId: string, guard: RoomsGuard, write: (tx: Tx, rooms: RoomRecord[]) => Promise<T>) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "server" WHERE id = ${serverId} FOR UPDATE`
      const rooms = await listRooms(tx, serverId)
      guard(rooms)
      return write(tx, rooms)
    })
  }
}

function listRooms(client: Tx, serverId: string): Promise<RoomRecord[]> {
  return client.room.findMany({ where: { serverId }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], select })
}
