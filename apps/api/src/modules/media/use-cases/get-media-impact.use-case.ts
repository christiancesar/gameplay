import { Injectable } from '@nestjs/common'
import type { MediaImpact, MediaResource } from '@gameplay/contracts'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'
import { ServerNotFoundError } from '../../servers/errors/servers.errors'
import { MediaChangeService, type MediaSnapshot } from '../services/media-change.service'

// For the confirmation: how many people in voice rooms each resource would
// cut off if it went off now, globally or for one server.
@Injectable()
export class GetMediaImpactUseCase {
  constructor(
    private readonly change: MediaChangeService,
    private readonly media: MediaSettingsRepository,
  ) {}

  async execute(serverId: string | null): Promise<MediaImpact> {
    if (serverId && !(await this.media.findServer(serverId))) throw new ServerNotFoundError()
    const impact = { sfu: 0, mesh: 0, turn: 0 }
    for (const resource of ['sfu', 'mesh', 'turn'] as const) {
      const cut = await this.change.preview(serverId, (snapshot) => turnedOff(snapshot, serverId, resource))
      impact[resource] = new Set(cut[resource]).size
    }
    return impact
  }
}

function turnedOff(snapshot: MediaSnapshot, serverId: string | null, resource: MediaResource): MediaSnapshot {
  if (!serverId) return { ...snapshot, global: { ...snapshot.global, [resource]: false } }
  const overrides = new Map(snapshot.overrides)
  const current = overrides.get(serverId) ?? { sfu: null, mesh: null, turn: null }
  overrides.set(serverId, { ...current, [resource]: false })
  return { ...snapshot, overrides }
}
