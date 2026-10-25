import type { AudioOutput } from './audio-engine'
import type { MediaTransport } from './media-transport'

/**
 * The media of the voice call in progress, as other features (screen share) need it. It exists while the
 * call has a transport and ends with it.
 */
type CallMedia = {
  serverId: string
  roomId: string
  selfId: string
  transport: MediaTransport
  audio: AudioOutput
}

export type { CallMedia }
