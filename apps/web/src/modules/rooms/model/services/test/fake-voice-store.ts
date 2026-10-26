import { idleVoice, type VoiceSnapshot, type VoiceStateStore } from '../../entities/voice-state'

class FakeVoiceStore implements VoiceStateStore {
  state: VoiceSnapshot = { ...idleVoice }

  getState() {
    return this.state
  }

  setState(partial: Partial<VoiceSnapshot>) {
    this.state = { ...this.state, ...partial }
  }
}

export { FakeVoiceStore }
