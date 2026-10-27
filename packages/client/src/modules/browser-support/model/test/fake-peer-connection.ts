import type { PeerConnectionLike } from '@/modules/browser-support/model/services/stun-ip.service'

type FakeScript = {
  /** Candidate lines the fake emits once the local description is set. */
  candidates?: string[]
  /** Emit the end-of-gathering event (null candidate). */
  complete?: boolean
  failOffer?: boolean
}

/** `RTCPeerConnection` stand-in: emits the scripted candidates when the offer is applied. */
function createFakePeerConnection(script: FakeScript = {}) {
  const connection: PeerConnectionLike & { closed: boolean; configuration?: unknown } = {
    closed: false,
    onicecandidate: null,
    createDataChannel: () => ({}),
    createOffer: async () => {
      if (script.failOffer) throw new Error('offer failed')
      return {}
    },
    setLocalDescription: async () => {
      for (const candidate of script.candidates ?? []) connection.onicecandidate?.({ candidate: { candidate } })
      if (script.complete) connection.onicecandidate?.({ candidate: null })
    },
    close: () => {
      connection.closed = true
    },
  }
  return connection
}

export { createFakePeerConnection }
export type { FakeScript }
