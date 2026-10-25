import { levelFromSamples } from '@/modules/settings/model/rules/input-level'

type LevelListener = (level: number) => void

/** The slice of the browser this service needs, so specs can hand in a fake. */
type MicLevelEnv = {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>
  createAudioContext: () => Pick<AudioContext, 'createMediaStreamSource' | 'createAnalyser' | 'close'>
  requestFrame: (callback: () => void) => number
  cancelFrame: (handle: number) => void
}

type MicLevelMeter = {
  /** Opens the microphone and reports its level on every frame. Resolves with the stop function. */
  start: (deviceId: string | undefined, onLevel: LevelListener) => Promise<() => void>
}

const FFT_SIZE = 256

function createMicLevelMeter(env: MicLevelEnv): MicLevelMeter {
  return {
    async start(deviceId, onLevel) {
      const stream = await env.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true })
      const context = env.createAudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = FFT_SIZE
      context.createMediaStreamSource(stream).connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)

      let handle = 0
      let stopped = false
      const tick = () => {
        if (stopped) return
        analyser.getByteTimeDomainData(samples)
        onLevel(levelFromSamples(samples))
        handle = env.requestFrame(tick)
      }
      tick()

      return () => {
        if (stopped) return
        stopped = true
        env.cancelFrame(handle)
        stream.getTracks().forEach((track) => track.stop())
        void context.close()
      }
    },
  }
}

const micLevelMeter = createMicLevelMeter({
  getUserMedia: (constraints) => navigator.mediaDevices.getUserMedia(constraints),
  createAudioContext: () => new AudioContext(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
})

export { createMicLevelMeter, micLevelMeter }
export type { MicLevelEnv, MicLevelMeter }
