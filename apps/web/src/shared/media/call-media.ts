import type { AudioEngine, AudioOutput } from './audio-engine'
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
  /** Plays what peers send; the meter also reads local streams (the audio of my own screen). */
  audio: AudioOutput & Pick<AudioEngine, 'createMeter'>
}

export type { CallMedia }
