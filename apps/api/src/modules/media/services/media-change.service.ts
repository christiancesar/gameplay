import { Injectable, Logger } from '@nestjs/common'
import type {
  AnnouncementAudience,
  MediaNotice,
  MediaResource,
  MediaSettings,
  ServerMediaOverrides,
} from '@gameplay/contracts'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { resolveMedia } from '../../limits/domain/media'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'
import { SendAnnouncementUseCase } from '../../notifications/use-cases/send-announcement.use-case'
import { RoomStateStore } from '../../realtime/stores/room-state.store'
import { type CutOff, cutOff } from '../domain/media-cut-off'

// Global settings and the overrides of the servers that matter for a change.
export type MediaSnapshot = { global: MediaSettings; overrides: Map<string, ServerMediaOverrides | null> }
type Snapshot = MediaSnapshot

// Shared by the global and per-server changes: who is cut off, the write,
// the domain event that stops shares and revokes TURN, and the notice.
@Injectable()
export class MediaChangeService {
  private readonly logger = new Logger(MediaChangeService.name)

  constructor(
    private readonly media: MediaSettingsRepository,
    private readonly seats: RoomStateStore,
    private readonly events: DomainEventBus,
    private readonly sendAnnouncement: SendAnnouncementUseCase,
  ) {}

  // Who would be cut off if `change` were written now.
  async preview(serverId: string | null, change: (snapshot: Snapshot) => Snapshot): Promise<CutOff> {
    const seats = await this.seatsIn(serverId)
    const before = await this.snapshot(serverIdsOf(seats, serverId))
    return cutOff(seats, effective(before), effective(change(before)))
  }

  async apply(input: {
    serverId: string | null
    write: () => Promise<void>
    notice?: MediaNotice
    sentById: string
  }): Promise<{ notified: number }> {
    const { serverId, write, notice, sentById } = input
    const seats = await this.seatsIn(serverId)
    const serverIds = serverIdsOf(seats, serverId)
    const before = await this.snapshot(serverIds)
    await write()
    const after = await this.snapshot(serverIds)
    const cut = cutOff(seats, effective(before), effective(after))

    const disabled = (['sfu', 'mesh', 'turn'] as const).filter((resource) => wentOff(before, after, resource))
    this.logger.log(
      { serverId, sentById, disabled, cut: { sfu: cut.sfu.length, mesh: cut.mesh.length, turn: cut.turn.length } },
      'Media resources changed',
    )
    await this.events.publish('media.changed', { serverId, disabled, turnCutUserIds: cut.turn })
    if (!notice) return { notified: 0 }
    return { notified: await this.notify(notice, serverId, [...cut.sfu, ...cut.mesh, ...cut.turn], sentById) }
  }

  private async notify(notice: MediaNotice, serverId: string | null, affected: string[], sentById: string) {
    const { title, message } = notice
    if (notice.audience === 'affected' && affected.length === 0) return 0
    const audience: AnnouncementAudience =
      notice.audience === 'everyone'
        ? { type: 'everyone' }
        : notice.audience === 'members' && serverId
          ? { type: 'server', serverId }
          : { type: 'users', userIds: [...new Set(affected)] }
    const { recipients } = await this.sendAnnouncement.execute({ title, message, audience, sentById })
    return recipients
  }

  private async seatsIn(serverId: string | null) {
    return serverId ? this.seats.listServer(serverId) : this.seats.listAll()
  }

  private async snapshot(serverIds: string[]): Promise<Snapshot> {
    const overrides = new Map<string, ServerMediaOverrides | null>()
    for (const serverId of new Set(serverIds)) overrides.set(serverId, await this.media.findServer(serverId))
    return { global: await this.media.getGlobal(), overrides }
  }
}

// The servers whose settings matter: the ones with people in rooms, and the one changed.
function serverIdsOf(seats: { serverId: string }[], serverId: string | null): string[] {
  return [...seats.map((seat) => seat.serverId), ...(serverId ? [serverId] : [])]
}

function effective({ global, overrides }: Snapshot) {
  return (serverId: string) => resolveMedia(global, overrides.get(serverId) ?? null)
}

// Off now somewhere it was on: globally, or for a server in the snapshot.
function wentOff(before: Snapshot, after: Snapshot, resource: MediaResource): boolean {
  if (before.global[resource] && !after.global[resource]) return true
  return [...after.overrides.keys()].some(
    (serverId) => effective(before)(serverId)[resource] && !effective(after)(serverId)[resource],
  )
}
