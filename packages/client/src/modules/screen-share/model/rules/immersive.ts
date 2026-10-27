type ImmersiveInput = {
  /** The viewer asked for it (the fullscreen button or a double click). */
  expanded: boolean
  /** A phone turned sideways, where the video should take the whole screen. */
  phoneLandscape: boolean
  /** The viewer left it while sideways: it stays off until the phone turns upright again. */
  landscapeOptOut: boolean
}

/** Whether the stream player takes the whole screen, with its controls over the video. */
function isImmersive({ expanded, phoneLandscape, landscapeOptOut }: ImmersiveInput): boolean {
  return expanded || (phoneLandscape && !landscapeOptOut)
}

export { isImmersive }
export type { ImmersiveInput }
