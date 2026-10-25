const MIN_VOLUME = 0
const MAX_VOLUME = 200
const DEFAULT_VOLUME = 100

/** Percent the slider shows (0 to 200) for a person. */
function volumeOf(volumes: Readonly<Record<string, number>>, userId: string): number {
  return volumes[userId] ?? DEFAULT_VOLUME
}

/** Percent to the gain the audio graph takes (1 is unchanged), kept inside the slider range. */
function toGain(percent: number): number {
  return Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, percent)) / 100
}

export { DEFAULT_VOLUME, MAX_VOLUME, MIN_VOLUME, toGain, volumeOf }
