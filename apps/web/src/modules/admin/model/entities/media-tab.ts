import type { MediaProviderStatus, MediaSettings, ServerMediaOverrides } from '@gameplay/contracts'

/** O que a aba Mídia mostra. */
export type MediaTabData = {
  settings: MediaSettings
  providers: { sfu: MediaProviderStatus; turn: MediaProviderStatus }
  exceptions: readonly { serverId: string; serverName: string; overrides: ServerMediaOverrides }[]
}
