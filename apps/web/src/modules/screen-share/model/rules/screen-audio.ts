/** Key of a screen's audio in the audio engine, apart from the same person's voice. */
function screenAudioKey(streamerId: string): string {
  return `screen:${streamerId}`
}

/** The slider goes from 0 to 100; the engine takes a gain from 0 to 1. */
function toScreenGain(volume: number): number {
  return Math.min(100, Math.max(0, volume)) / 100
}

export { screenAudioKey, toScreenGain }
