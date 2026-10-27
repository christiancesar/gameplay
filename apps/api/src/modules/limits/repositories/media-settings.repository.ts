import type { MediaSettings, ServerMediaOverrides } from '@gameplay/contracts'

export type ServerMediaException = { serverId: string; serverName: string; overrides: ServerMediaOverrides }

// Media resources: the global setting and the per-server overrides.
export abstract class MediaSettingsRepository {
  abstract getGlobal(): Promise<MediaSettings>
  abstract setGlobal(settings: MediaSettings): Promise<void>
  // null when the server doesn't exist.
  abstract findServer(serverId: string): Promise<ServerMediaOverrides | null>
  // Returns false when the server doesn't exist.
  abstract setServer(serverId: string, overrides: ServerMediaOverrides): Promise<boolean>
  // Servers with at least one override, by name.
  abstract listExceptions(): Promise<ServerMediaException[]>
}
