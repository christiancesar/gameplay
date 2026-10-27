import type { MediaProviderStatus, MediaSettings, ServerMediaOverrides, RealtimeUsage } from '@gameplay/contracts'

/** O que a aba Mídia mostra. */
export type MediaTabData = {
  settings: MediaSettings
  usage: RealtimeUsage
  providers: { sfu: MediaProviderStatus; turn: MediaProviderStatus }
  exceptions: readonly { serverId: string; serverName: string; overrides: ServerMediaOverrides }[]
}
