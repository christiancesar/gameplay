import { useVoiceStore } from './stores/voice.store'
import { voiceController } from './voice.controller'

/**
 * The voice call as the screens need it. The state is the store (written by the call); the actions go
 * to the controller. Deafen counts as muted for the buttons, as the microphone is silenced either way.
 */
function useVoiceRoomViewModel() {
  const connection = useVoiceStore((state) => state.connection)
  const status = useVoiceStore((state) => state.status)
  const muted = useVoiceStore((state) => state.muted)
  const deafened = useVoiceStore((state) => state.deafened)
  const micDenied = useVoiceStore((state) => state.micDenied)
  const participants = useVoiceStore((state) => state.participants)
  const peers = useVoiceStore((state) => state.peers)
  const speaking = useVoiceStore((state) => state.speaking)
  const volumes = useVoiceStore((state) => state.volumes)

  return {
    connection,
    status,
    isMuted: muted || deafened,
    isDeafened: deafened,
    micDenied,
    participants,
    peers,
    speaking,
    volumes,
    joinRoom: (serverId: string, roomId: string) => void voiceController.join(serverId, roomId),
    leaveRoom: () => void voiceController.leave(),
    toggleMute: () => voiceController.toggleMute(),
    toggleDeafen: () => voiceController.toggleDeafen(),
    setVolume: (userId: string, percent: number) => voiceController.setVolume(userId, percent),
  }
}

export { useVoiceRoomViewModel }
