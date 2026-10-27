import type { MediaProviderStatus, MediaSettings, ServerMediaOverrides, SfuUsage } from '@gameplay/contracts'

/** O que a aba Mídia mostra. */
export type MediaTabData = {
  settings: MediaSettings
  sfuUsage: SfuUsage
  providers: { sfu: MediaProviderStatus; turn: MediaProviderStatus }
  exceptions: readonly { serverId: string; serverName: string; overrides: ServerMediaOverrides }[]
}
