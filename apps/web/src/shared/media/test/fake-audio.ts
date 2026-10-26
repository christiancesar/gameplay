import { vi } from 'vitest'

import type {
  AnalyserNodeLike,
  AudioContextLike,
  AudioElementLike,
  GainNodeLike,
  StreamDestinationLike,
} from '../audio-engine'

class FakeNode {
  readonly connected: unknown[] = []
  disconnected = false
  connect(destination: unknown) {
    this.connected.push(destination)
  }
  disconnect() {
    this.disconnected = true
  }
}

class FakeGain extends FakeNode implements GainNodeLike {
  readonly gain = { value: 1 }
}

class FakeAnalyser extends FakeNode implements AnalyserNodeLike {
  fftSize = 2048
  /** Constant sample value the analyser reports; set it to simulate loud or quiet input. */
  level = 0
  getFloatTimeDomainData(array: Float32Array<ArrayBuffer>) {
    array.fill(this.level)
  }
}

class FakeDestination extends FakeNode implements StreamDestinationLike {
  readonly stream = { id: 'destination-stream' } as unknown as MediaStream
}

class FakeAudioContext implements AudioContextLike {
  readonly gains: FakeGain[] = []
  readonly analysers: FakeAnalyser[] = []
  readonly sources: FakeNode[] = []
  readonly destination = new FakeDestination()
  readonly resume = vi.fn(async () => undefined)
  readonly close = vi.fn(async () => undefined)
  createMediaStreamSource() {
    const node = new FakeNode()
    this.sources.push(node)
    return node
  }
  createGain() {
    const node = new FakeGain()
    this.gains.push(node)
    return node
  }
  createAnalyser() {
    const node = new FakeAnalyser()
    this.analysers.push(node)
    return node
  }
  createMediaStreamDestination() {
    return this.destination
  }
}

class FakeAudioElement implements AudioElementLike {
  srcObject: MediaStream | null = null
  muted = false
  readonly play = vi.fn(async () => undefined)
  readonly pause = vi.fn()
  readonly setSinkId = vi.fn(async () => undefined)
}

export { FakeAnalyser, FakeAudioContext, FakeAudioElement, FakeGain }
