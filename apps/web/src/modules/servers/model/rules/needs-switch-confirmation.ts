import type { VoiceConnection } from '@/modules/rooms/model/entities/voice-state'

/** One voice connection at a time: entering another server while connected needs the user's confirmation. */
function needsSwitchConfirmation(connection: VoiceConnection | null, targetServerId: string): boolean {
  return connection !== null && connection.serverId !== targetServerId
}

export { needsSwitchConfirmation }
