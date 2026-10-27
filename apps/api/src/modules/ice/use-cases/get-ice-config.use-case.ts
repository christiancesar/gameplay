import { Injectable, Logger } from '@nestjs/common'
import { EffectiveMediaService } from '../../limits/services/effective-media.service'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'
import { IceProvider, type IssuedIce } from '../providers/ice/ice.provider'
import { StunOnlyIceProvider } from '../providers/ice/stun-only/stun-only.ice.provider'

type Cached = { issued: IssuedIce; expiresAt: number }

// When the TURN provider fails, the web gets STUN only and asks again soon.
const FALLBACK_TTL_SECONDS = 60

// ICE servers for a user. Credentials are reused while more than half of
// their lifetime is left, so entering rooms doesn't call Cloudflare each time.
// Where the platform admin turned TURN off (for the server of the room, or
// for the platform when no server is given) only STUN is handed out.
@Injectable()
export class GetIceConfigUseCase {
  private readonly logger = new Logger(GetIceConfigUseCase.name)
  private readonly cache = new Map<string, Cached>()

  constructor(
    private readonly provider: IceProvider,
    private readonly fallback: StunOnlyIceProvider,
    private readonly media: EffectiveMediaService,
    private readonly mediaSettings: MediaSettingsRepository,
  ) {}

  async execute(userId: string, serverId?: string): Promise<IssuedIce> {
    if (!(await this.turnOn(serverId))) return this.fallback.issue()

    const now = Date.now()
    const cached = this.cache.get(userId)
    if (cached && cached.expiresAt - now > (cached.issued.ttlSeconds * 1000) / 2) {
      return { ...cached.issued, ttlSeconds: Math.floor((cached.expiresAt - now) / 1000) }
    }

    let issued: IssuedIce
    try {
      issued = await this.provider.issue(userId)
    } catch (error) {
      this.logger.warn({ err: error }, 'ICE provider failed; answering with STUN only')
      return { ...(await this.fallback.issue()), ttlSeconds: FALLBACK_TTL_SECONDS }
    }
    if (issued.ttlSeconds > 0) {
      this.prune(now)
      this.cache.set(userId, { issued, expiresAt: now + issued.ttlSeconds * 1000 })
    }
    return issued
  }

  // The relay went off for these people: their credentials stop working now.
  async revokeFor(userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      const cached = this.cache.get(userId)
      if (!cached) continue
      this.cache.delete(userId)
      try {
        await this.provider.revoke(cached.issued)
      } catch (error) {
        this.logger.warn({ err: error, userId }, 'Could not revoke TURN credentials')
      }
    }
  }

  private async turnOn(serverId?: string): Promise<boolean> {
    return serverId ? this.media.isOn(serverId, 'turn') : (await this.mediaSettings.getGlobal()).turn
  }

  private prune(now: number) {
    for (const [userId, { expiresAt }] of this.cache) {
      if (expiresAt <= now) this.cache.delete(userId)
    }
  }
}
