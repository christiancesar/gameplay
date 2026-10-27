/** Speech RMS sits around 0.05 to 0.3 of full scale; the gain makes the meter use most of its range. */
const LEVEL_GAIN = 3
const SILENCE = 128

/** Time-domain bytes from an AnalyserNode (128 is silence) to a 0..1 level. */
function levelFromSamples(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0
  let sum = 0
  for (let index = 0; index < samples.length; index += 1) {
    const centered = (samples[index]! - SILENCE) / SILENCE
    sum += centered * centered
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * LEVEL_GAIN)
}

export { levelFromSamples }
