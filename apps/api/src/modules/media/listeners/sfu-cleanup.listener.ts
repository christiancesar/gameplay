import { Injectable, Logger } from '@nestjs/common'
import { OnDomainEvent } from '../../../common/events/domain-event-bus'
import type { DomainEvents } from '../../../common/events/domain-events'
import type { SfuSession } from '../../realtime/domain/sfu-session'
import { SfuSessionStore } from '../../realtime/stores/sfu-session.store'
import { SfuProvider } from '../providers/sfu/sfu.provider'

// Closes on the SFU what nobody may use anymore: the sessions of a room the
// person left, and the published screen once the share stops or moves to
// mesh. Cloudflare would drop idle tracks after 30 s anyway; closing them
// cuts the viewers right away. A failure here never blocks the voice room.
@Injectable()
export class SfuCleanupListener {
  private readonly logger = new Logger(SfuCleanupListener.name)

  constructor(
    private readonly provider: SfuProvider,
    private readonly sessions: SfuSessionStore,
  ) {}

  @OnDomainEvent('voice.left-room')
  async leftRoom({ userId, roomId }: DomainEvents['voice.left-room']): Promise<void> {
    const inRoom = (await this.sessions.listByUser(userId)).filter((session) => session.roomId === roomId)
    for (const session of inRoom) {
      await this.closeTracks(
        session,
        [...session.published, ...session.pulled].map((track) => track.mid),
      )
      await this.sessions.remove(session.sessionId)
    }
    if (inRoom.some((session) => session.published.length > 0)) await this.sessions.removePullsOf(userId)
  }

  @OnDomainEvent('stream.changed')
  async streamChanged({ userId, mode }: DomainEvents['stream.changed']): Promise<void> {
    if (mode === 'sfu') return
    const publication = await this.sessions.publicationOf(userId)
    if (!publication) return
    const mids = publication.published.map((track) => track.mid)
    await this.closeTracks(publication, mids)
    await this.sessions.removeTracks(publication.sessionId, mids)
    await this.sessions.removePullsOf(userId)
  }

  private async closeTracks({ sessionId, userId }: SfuSession, mids: string[]): Promise<void> {
    if (mids.length === 0 || !this.provider.configured) return
    try {
      await this.provider.close(sessionId, mids)
    } catch (error) {
      this.logger.warn({ err: error, userId, sessionId }, 'Could not close SFU tracks')
    }
  }
}
