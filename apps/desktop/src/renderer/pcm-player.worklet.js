// Plays the PCM the main process sends (s16le, 48 kHz, 2 channels, interleaved) as the output of a worklet node.
// Plain JavaScript on purpose: the browser loads it by itself, so it cannot import anything.
class PcmPlayer extends AudioWorkletProcessor {
  constructor() {
    super()
    // One second of frames per channel, as a ring.
    this.capacity = 48000
    this.left = new Float32Array(this.capacity)
    this.right = new Float32Array(this.capacity)
    this.read = 0
    this.write = 0
    this.size = 0
    // After a gap the sound waits for this much before it plays again, and never lags behind by more than the max.
    this.primeFrames = 1920 // 40 ms
    this.maxFrames = 9600 // 200 ms
    this.primed = false
    // A piece may end in the middle of a frame (4 bytes): the rest waits for the next one.
    this.leftover = new Uint8Array(0)
    this.port.onmessage = (event) => this.push(event.data)
  }

  push(bytes) {
    let data = bytes
    if (this.leftover.length > 0) {
      data = new Uint8Array(this.leftover.length + bytes.length)
      data.set(this.leftover, 0)
      data.set(bytes, this.leftover.length)
    }
    const frames = Math.floor(data.length / 4)
    const view = new DataView(data.buffer, data.byteOffset, frames * 4)
    for (let i = 0; i < frames; i++) {
      if (this.size === this.capacity) {
        this.read = (this.read + 1) % this.capacity
        this.size--
      }
      this.left[this.write] = view.getInt16(i * 4, true) / 32768
      this.right[this.write] = view.getInt16(i * 4 + 2, true) / 32768
      this.write = (this.write + 1) % this.capacity
      this.size++
    }
    this.leftover = data.slice(frames * 4)
    if (this.size > this.maxFrames) {
      const drop = this.size - this.primeFrames
      this.read = (this.read + drop) % this.capacity
      this.size -= drop
    }
  }

  process(_inputs, outputs) {
    const [left, right] = outputs[0]
    if (!this.primed && this.size >= this.primeFrames) this.primed = true
    for (let i = 0; i < left.length; i++) {
      if (this.primed && this.size > 0) {
        left[i] = this.left[this.read]
        right[i] = this.right[this.read]
        this.read = (this.read + 1) % this.capacity
        this.size--
      } else {
        left[i] = 0
        right[i] = 0
        if (this.size === 0) this.primed = false
      }
    }
    return true
  }
}

registerProcessor('pcm-player', PcmPlayer)
