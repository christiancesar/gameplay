import { Injectable } from '@nestjs/common'
import { PresenceStore } from '../presence.store'

@Injectable()
export class InMemoryPresenceStore extends PresenceStore {
  private readonly sockets = new Map<string, Set<string>>()

  async add(userId: string, socketId: string): Promise<boolean> {
    const sockets = this.sockets.get(userId)
    if (sockets) {
      sockets.add(socketId)
      return false
    }
    this.sockets.set(userId, new Set([socketId]))
    return true
  }

  async remove(userId: string, socketId: string): Promise<boolean> {
    const sockets = this.sockets.get(userId)
    if (!sockets?.delete(socketId)) return false
    if (sockets.size > 0) return false
    this.sockets.delete(userId)
    return true
  }

  async isOnline(userId: string): Promise<boolean> {
    return this.sockets.has(userId)
  }

  async onlineAmong(userIds: string[]): Promise<string[]> {
    return userIds.filter((userId) => this.sockets.has(userId))
  }

  async onlineUserIds(): Promise<string[]> {
    return [...this.sockets.keys()]
  }
}
