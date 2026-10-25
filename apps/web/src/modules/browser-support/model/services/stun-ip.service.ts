import type { IceServer } from '@gameplay/contracts'

type IceCandidateEventLike = { candidate: { candidate: string } | null }

/** The slice of `RTCPeerConnection` the gathering uses; tests pass a fake. */
type PeerConnectionLike = {
  onicecandidate: ((event: IceCandidateEventLike) => void) | null
  createDataChannel: (label: string) => unknown
  createOffer: () => Promise<unknown>
  setLocalDescription: (description: never) => Promise<void>
  close: () => void
}

type PeerConnectionFactory = (configuration: { iceServers: IceServer[] }) => PeerConnectionLike

type StunIpService = {
  /** Public addresses the STUN servers saw (`srflx` candidates). Empty when gathering fails or times out. */
  gatherPublicIps: (iceServers: readonly IceServer[]) => Promise<string[]>
}

const GATHER_TIMEOUT_MS = 3000

/** "candidate:1 1 udp 2113937151 203.0.113.7 54321 typ srflx ..." -> "203.0.113.7" */
function parseServerReflexiveAddress(candidate: string): string | null {
  const parts = candidate.split(' ')
  if (parts[parts.indexOf('typ') + 1] !== 'srflx') return null
  return parts[4] ?? null
}

/** Only STUN urls: TURN entries carry credentials and add relay candidates this check does not need. */
function stunOnly(iceServers: readonly IceServer[]): IceServer[] {
  return iceServers
    .map((server) => ({ urls: server.urls.filter((url) => url.startsWith('stun:') || url.startsWith('stuns:')) }))
    .filter((server) => server.urls.length > 0)
}

function createStunIpService(createConnection: PeerConnectionFactory, timeoutMs = GATHER_TIMEOUT_MS): StunIpService {
  return {
    async gatherPublicIps(iceServers) {
      const servers = stunOnly(iceServers)
      if (servers.length === 0) return []

      const addresses = new Set<string>()
      let connection: PeerConnectionLike | undefined
      try {
        connection = createConnection({ iceServers: servers })
        const current = connection
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, timeoutMs)
          const finish = () => {
            clearTimeout(timer)
            resolve()
          }
          current.onicecandidate = (event) => {
            if (!event.candidate) return finish()
            const address = parseServerReflexiveAddress(event.candidate.candidate)
            if (address) addresses.add(address)
          }
          current.createDataChannel('probe')
          current
            .createOffer()
            .then((offer) => current.setLocalDescription(offer as never))
            .catch((error: unknown) => {
              clearTimeout(timer)
              reject(error instanceof Error ? error : new Error('ICE gathering failed'))
            })
        })
      } catch {
        // Best effort: whatever was gathered before the failure still counts.
      } finally {
        connection?.close()
      }
      return [...addresses]
    },
  }
}

export { createStunIpService, parseServerReflexiveAddress }
export type { PeerConnectionFactory, PeerConnectionLike, StunIpService }
