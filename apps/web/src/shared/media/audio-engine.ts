/** Small slices of the Web Audio and media element APIs, so specs run on fakes. */
type AudioParamLike = { value: number }
type AudioNodeLike = { connect(destination: AudioNodeLike): unknown; disconnect(): void }
type GainNodeLike = AudioNodeLike & { readonly gain: AudioParamLike }
type AnalyserNodeLike = AudioNodeLike & {
  fftSize: number
  getFloatTimeDomainData(array: Float32Array<ArrayBuffer>): void
}
type StreamDestinationLike = AudioNodeLike & { readonly stream: MediaStream }

type AudioContextLike = {
  createMediaStreamSource(stream: MediaStream): AudioNodeLike
  createGain(): GainNodeLike
  createAnalyser(): AnalyserNodeLike
  createMediaStreamDestination(): StreamDestinationLike
  resume(): Promise<void>
  close(): Promise<void>
}

type AudioElementLike = {
  srcObject: MediaStream | null
  muted: boolean
  play(): Promise<void>
  pause(): void
  /** Missing in browsers that cannot pick the output device. */
  setSinkId?(deviceId: string): Promise<void>
}

type AudioEngineFactories = {
  createContext: () => AudioContextLike
  createElement: () => AudioElementLike
  /** Calls the handler once, on the next click or key press. Returns the function that stops waiting. */
  onUserGesture?: (handler: () => void) => () => void
}

/** Plays what the peers send. Volume goes from 0 to 2 (200 %). */
type AudioOutput = {
  addStream(peerId: string, stream: MediaStream): void
  removeStream(peerId: string): void
  setVolume(peerId: string, volume: number): void
  /** Deafen: nobody is heard, whatever their volume. */
  setDeafened(deafened: boolean): void
  /** Picks the speakers. Resolves false when the browser cannot. `undefined` is the system default. */
  setSinkId(deviceId: string | undefined): Promise<boolean>
}

/** Reads how loud a stream is, from 0 to 1. */
type LevelMeter = { read(): number; dispose(): void }

type AudioEngine = AudioOutput & {
  createMeter(stream: MediaStream): LevelMeter
  dispose(): void
}

type PeerAudio = { element: AudioElementLike; source: AudioNodeLike; gain: GainNodeLike }

const GESTURE_EVENTS = ['pointerdown', 'keydown'] as const

const createBrowserAudioFactories = (): AudioEngineFactories => ({
  createContext: () => new AudioContext() as unknown as AudioContextLike,
  createElement: () => new Audio() as unknown as AudioElementLike,
  onUserGesture: (handler) => {
    const stop = () => {
      for (const event of GESTURE_EVENTS) document.removeEventListener(event, run, true)
    }
    const run = () => {
      stop()
      handler()
    }
    for (const event of GESTURE_EVENTS) document.addEventListener(event, run, true)
    return stop
  },
})

/**
 * One AudioContext per call. Every peer goes source -> own gain (their volume) -> master gain (deafen)
 * -> one hidden audio element, which is the only thing that needs `setSinkId`.
 */
class WebAudioEngine implements AudioEngine {
  private readonly context: AudioContextLike
  private readonly master: GainNodeLike
  private readonly sink: AudioElementLike
  private readonly createElement: () => AudioElementLike
  private readonly onUserGesture: AudioEngineFactories['onUserGesture']
  private stopWaitingGesture: (() => void) | undefined
  private readonly peers = new Map<string, PeerAudio>()
  private readonly volumes = new Map<string, number>()
  private disposed = false

  constructor(factories: AudioEngineFactories) {
    this.createElement = factories.createElement
    this.onUserGesture = factories.onUserGesture
    this.context = factories.createContext()
    this.master = this.context.createGain()
    const destination = this.context.createMediaStreamDestination()
    this.master.connect(destination)
    this.sink = factories.createElement()
    this.sink.srcObject = destination.stream
    // Autoplay rules: a call started from a click plays at once. One resumed after a reload has no click
    // yet, so the browser blocks the sound until the next one.
    void this.context.resume().catch(() => undefined)
    void this.sink.play().catch(() => this.startOnGesture())
  }

  private startOnGesture() {
    if (this.disposed || !this.onUserGesture) return
    this.stopWaitingGesture?.()
    this.stopWaitingGesture = this.onUserGesture(() => {
      this.stopWaitingGesture = undefined
      if (this.disposed) return
      void this.context.resume().catch(() => undefined)
      void this.sink.play().catch(() => undefined)
    })
  }

  addStream(peerId: string, stream: MediaStream): void {
    if (this.disposed) return
    this.removeStream(peerId)
    // Chrome only feeds Web Audio from a remote stream that is also attached to a media element.
    const element = this.createElement()
    element.muted = true
    element.srcObject = stream
    void element.play().catch(() => undefined)

    const source = this.context.createMediaStreamSource(stream)
    const gain = this.context.createGain()
    gain.gain.value = this.volumes.get(peerId) ?? 1
    source.connect(gain)
    gain.connect(this.master)
    this.peers.set(peerId, { element, source, gain })
  }

  removeStream(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (!peer) return
    peer.source.disconnect()
    peer.gain.disconnect()
    peer.element.pause()
    peer.element.srcObject = null
    this.peers.delete(peerId)
  }

  setVolume(peerId: string, volume: number): void {
    this.volumes.set(peerId, volume)
    const peer = this.peers.get(peerId)
    if (peer) peer.gain.gain.value = volume
  }

  setDeafened(deafened: boolean): void {
    this.master.gain.value = deafened ? 0 : 1
  }

  async setSinkId(deviceId: string | undefined): Promise<boolean> {
    if (!this.sink.setSinkId) return false
    try {
      await this.sink.setSinkId(deviceId ?? '')
      return true
    } catch {
      return false
    }
  }

  createMeter(stream: MediaStream): LevelMeter {
    const source = this.context.createMediaStreamSource(stream)
    const analyser = this.context.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const samples = new Float32Array(analyser.fftSize)
    return {
      read: () => {
        analyser.getFloatTimeDomainData(samples)
        let sum = 0
        for (const sample of samples) sum += sample * sample
        return Math.sqrt(sum / samples.length)
      },
      dispose: () => {
        source.disconnect()
        analyser.disconnect()
      },
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stopWaitingGesture?.()
    this.stopWaitingGesture = undefined
    for (const peerId of [...this.peers.keys()]) this.removeStream(peerId)
    this.sink.pause()
    this.sink.srcObject = null
    void this.context.close().catch(() => undefined)
  }
}

export { WebAudioEngine, createBrowserAudioFactories }
export type {
  AnalyserNodeLike,
  AudioContextLike,
  AudioElementLike,
  AudioEngine,
  AudioEngineFactories,
  AudioNodeLike,
  AudioOutput,
  GainNodeLike,
  LevelMeter,
  StreamDestinationLike,
}
