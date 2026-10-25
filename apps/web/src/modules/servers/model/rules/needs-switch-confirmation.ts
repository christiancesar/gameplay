import type { VoiceConnection } from '@/modules/rooms/view-models/stores/voice.store'

/** One voice connection at a time: entering another server while connected needs the user's confirmation. */
function needsSwitchConfirmation(connection: VoiceConnection | null, targetServerId: string): boolean {
  return connection !== null && connection.serverId !== targetServerId
}

export { needsSwitchConfirmation }
