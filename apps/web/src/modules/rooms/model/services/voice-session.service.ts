import type { IceConfigResponse, Participant } from '@gameplay/contracts'

import type { RealtimeService } from '@/modules/realtime/model/services/realtime.service'
import type { AudioEngine } from '@/shared/media/audio-engine'
import type { CallMedia } from '@/shared/media/call-media'
import type { MediaTransport, PeerStatus } from '@/shared/media/media-transport'
import type { MicrophoneHandle, MicrophoneResult } from '@/shared/media/microphone'

import { idleVoice, type VoiceNotice, type VoiceSnapshot, type VoiceStateStore } from '../entities/voice-state'
import { iceRenewalDelayMs } from '../rules/ice-renewal'
import { diffPeers } from '../rules/peer-roster'
import { peerRetryDelayMs } from '../rules/retry-delay'
import { isMicSilenced } from '../rules/voice-effective'
import { MAX_VOLUME, MIN_VOLUME, toGain, volumeOf } from '../rules/volume'

/** The socket side of the call. `RealtimeService` fits it; specs pass a fake. */
type VoiceRealtime = Pick<RealtimeService, 'joinRoom' | 'leaveRoom' | 'sendVoiceState' | 'on' | 'onStatusChange'>

type SpeakingWatcher = {
  watch(id: string, stream: MediaStream): void
  unwatch(id: string): void
  dispose(): void
}

type VoiceSessionDeps = {
  realtime: VoiceRealtime
  store: VoiceStateStore
  getSelfId: () => string | undefined
  /** Devices chosen in the settings; `undefined` is the system default. */
  getPreferences: () => { inputDeviceId: string | undefined; outputDeviceId: string | undefined }
  acquireMicrophone: (deviceId: string | undefined) => Promise<MicrophoneResult>
  stopMicrophone: (microphone: MicrophoneHandle) => void
  /** `renewal` skips any cache: the credentials in hand are about to expire. */
  loadIceConfig: (renewal: boolean) => Promise<IceConfigResponse>
  createEngine: () => AudioEngine
  createTransport: (options: { selfId: string; iceServers: IceConfigResponse['iceServers'] }) => MediaTransport
  createSpeakingWatcher: (engine: AudioEngine, onChange: (speakingIds: readonly string[]) => void) => SpeakingWatcher
}

/** The ICE config request failed: ask again soon, the call still works on what it has. */
const ICE_RETRY_MS = 15_000

type Retry = { attempt: number; timer: ReturnType<typeof setTimeout> | undefined }

/** Everything one call holds. Created when joining and released as a whole. */
type Active = {
  serverId: string
  roomId: string
  selfId: string
  mic: MicrophoneHandle | null
  engine: AudioEngine | null
  transport: MediaTransport | null
  watcher: SpeakingWatcher | null
  watchingSelf: boolean
  /** Peers this call opened a connection for, to tell who joined and who left. */
  knownPeers: Set<string>
  retries: Map<string, Retry>
  iceTimer: ReturnType<typeof setTimeout> | undefined
  stops: (() => void)[]
  /** When the socket dropped, while it is down. */
  droppedAt: number | null
}

/**
 * The voice call of this tab: one room at a time, outside React so it survives navigation. It joins
 * through the socket, runs the media transport and the audio, and writes what the UI shows into the
 * store it is given. The browser APIs come in through `deps`.
 */
class VoiceSession {
  private readonly deps: VoiceSessionDeps
  private active: Active | null = null
  private media: CallMedia | null = null
  private readonly mediaHandlers = new Set<(media: CallMedia | null) => void>()

  constructor(deps: VoiceSessionDeps) {
    this.deps = deps
  }

  /** Enters a room, leaving the current one (the API moves the seat in one step). */
  async join(serverId: string, roomId: string): Promise<void> {
    const { store, realtime } = this.deps
    const previous = this.active
    if (previous?.roomId === roomId && previous.serverId === serverId) return
    if (previous) this.release(previous, { leaveRoom: false })

    // Switching rooms keeps mute and deafen; the volumes are kept across calls.
    const { muted, deafened, volumes } = store.getState()
    const keepState = previous ? { muted, deafened } : {}
    store.setState({
      ...idleVoice,
      ...keepState,
      volumes,
      connection: { serverId, roomId },
      status: 'joining',
    })

    const selfId = this.deps.getSelfId()
    if (!selfId) {
      this.reset('join-failed')
      return
    }

    const active: Active = {
      serverId,
      roomId,
      selfId,
      mic: null,
      engine: null,
      transport: null,
      watcher: null,
      watchingSelf: false,
      knownPeers: new Set(),
      retries: new Map(),
      iceTimer: undefined,
      stops: [],
      droppedAt: null,
    }
    this.active = active

    const preferences = this.deps.getPreferences()
    const mic = await this.deps.acquireMicrophone(preferences.inputDeviceId)
    if (this.active !== active) {
      if (mic.ok) this.deps.stopMicrophone(mic.microphone)
      return
    }
    if (mic.ok) active.mic = mic.microphone
    else store.setState({ micDenied: true })

    let ice: IceConfigResponse = { iceServers: [], ttlSeconds: 0, requestIp: null }
    let iceFailed = false
    try {
      ice = await this.deps.loadIceConfig(false)
    } catch {
      iceFailed = true
    }
    if (this.active !== active) return

    const engine = this.deps.createEngine()
    const transport = this.deps.createTransport({ selfId, iceServers: ice.iceServers })
    active.engine = engine
    active.transport = transport
    active.watcher = this.deps.createSpeakingWatcher(engine, (ids) =>
      store.setState({ speaking: Object.fromEntries(ids.map((id) => [id, true])) }),
    )
    void engine.setSinkId(preferences.outputDeviceId)
    void transport.setVoiceTrack(active.mic?.track ?? null)
    this.setMedia({ serverId, roomId, selfId, transport, audio: engine })

    active.stops.push(
      transport.onPeerStatus((peerId, status) => this.onPeerStatus(active, peerId, status)),
      transport.onRemoteTrack((peerId, track, stream, source) => {
        // Screen tracks belong to the screen share, which follows the media of the call.
        if (source !== 'voice' || track.kind !== 'audio') return
        engine.setVolume(peerId, toGain(volumeOf(store.getState().volumes, peerId)))
        engine.addStream(peerId, stream)
        active.watcher?.watch(peerId, stream)
      }),
      realtime.on('room:participants', (event) => {
        if (event.roomId === roomId) this.applyRoster(active, event.participants)
      }),
      realtime.on('room:left', ({ roomId: leftRoomId, reason }) => {
        if (leftRoomId !== roomId) return
        if (reason === 'other-tab') this.finish(active, 'other-tab')
        else if (reason === 'room-deleted') this.finish(active, 'room-deleted')
        else this.finish(active, null)
      }),
      // Left, kicked or deleted: the call of that server ends even if the API's room:left is late.
      realtime.on('server:removed', (event) => {
        if (event.serverId === serverId) this.finish(active, null)
      }),
      realtime.onStatusChange((status) => this.onSocketStatus(active, status)),
    )
    this.applyLocalState(active)

    const state = store.getState()
    try {
      const participants = await realtime.joinRoom({
        roomId,
        muted: isMicSilenced(state),
        deafened: state.deafened,
      })
      if (this.active !== active) return
      store.setState({ status: 'connected' })
      this.applyRoster(active, participants)
    } catch {
      if (this.active !== active) return
      // The seat of a previous room may still be held when the API refused the new one.
      realtime.leaveRoom().catch(() => undefined)
      this.finish(active, 'join-failed')
      return
    }
    this.scheduleIceRenewal(active, iceFailed ? ICE_RETRY_MS : iceRenewalDelayMs(ice.ttlSeconds))
  }

  /**
   * Follows the media of the call: gets the current one at once, then every change (a transport appears
   * when a call starts and goes away when it ends). Screen share builds on it.
   */
  subscribeMedia(handler: (media: CallMedia | null) => void): () => void {
    this.mediaHandlers.add(handler)
    handler(this.media)
    return () => this.mediaHandlers.delete(handler)
  }

  /** Leaves the room. Safe to call when not in one. */
  async leave(): Promise<void> {
    const active = this.active
    if (active) this.release(active, { leaveRoom: true })
    this.reset(null)
  }

  /** Mute. While deafened it also undeafens, as in Discord. */
  toggleMute(): void {
    const active = this.active
    if (!active) return
    const { muted, deafened } = this.deps.store.getState()
    this.deps.store.setState(deafened ? { muted: false, deafened: false } : { muted: !muted })
    this.applyLocalState(active)
    this.sendVoiceState()
  }

  toggleDeafen(): void {
    const active = this.active
    if (!active) return
    this.deps.store.setState({ deafened: !this.deps.store.getState().deafened })
    this.applyLocalState(active)
    this.sendVoiceState()
  }

  /** Volume of one person for me, in percent. */
  setVolume(userId: string, percent: number): void {
    const volume = Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, percent))
    const { store } = this.deps
    store.setState({ volumes: { ...store.getState().volumes, [userId]: volume } })
    this.active?.engine?.setVolume(userId, toGain(volume))
  }

  /** The microphone chosen in the settings changed. Also lifts "listen only" if the new one works. */
  async setInputDevice(deviceId: string | undefined): Promise<void> {
    const active = this.active
    if (!active?.transport) return
    const result = await this.deps.acquireMicrophone(deviceId)
    if (this.active !== active || !active.transport) {
      if (result.ok) this.deps.stopMicrophone(result.microphone)
      return
    }
    if (!result.ok) return
    const previous = active.mic
    active.mic = result.microphone
    active.watchingSelf = false
    await active.transport.setVoiceTrack(result.microphone.track)
    if (previous) this.deps.stopMicrophone(previous)
    this.deps.store.setState({ micDenied: false })
    this.applyLocalState(active)
  }

  setOutputDevice(deviceId: string | undefined): void {
    void this.active?.engine?.setSinkId(deviceId)
  }

  dismissNotice(): void {
    this.deps.store.setState({ notice: null })
  }

  private applyRoster(active: Active, participants: Participant[]) {
    if (this.active !== active || !active.transport) return
    const { added, removed } = diffPeers(
      active.knownPeers,
      participants.map((participant) => participant.userId),
      active.selfId,
    )
    for (const peerId of removed) this.dropPeer(active, peerId)
    for (const peerId of added) {
      active.knownPeers.add(peerId)
      active.transport.addPeer(peerId)
    }
    const { store } = this.deps
    const { peers, speaking } = store.getState()
    const present = new Set(participants.map((participant) => participant.userId))
    store.setState({
      participants,
      peers: Object.fromEntries(Object.entries(peers).filter(([id]) => present.has(id))),
      speaking: Object.fromEntries(Object.entries(speaking).filter(([id]) => present.has(id))),
    })
  }

  private dropPeer(active: Active, peerId: string) {
    active.knownPeers.delete(peerId)
    const retry = active.retries.get(peerId)
    clearTimeout(retry?.timer)
    active.retries.delete(peerId)
    active.transport?.removePeer(peerId)
    active.engine?.removeStream(peerId)
    active.watcher?.unwatch(peerId)
  }

  private onPeerStatus(active: Active, peerId: string, status: PeerStatus) {
    if (this.active !== active) return
    const { store } = this.deps
    store.setState({ peers: { ...store.getState().peers, [peerId]: status } })
    if (status === 'connected') {
      clearTimeout(active.retries.get(peerId)?.timer)
      active.retries.delete(peerId)
    } else if (status === 'failed') {
      this.scheduleRetry(active, peerId)
    }
  }

  private scheduleRetry(active: Active, peerId: string) {
    const retry = active.retries.get(peerId) ?? { attempt: 0, timer: undefined }
    if (retry.timer) return
    retry.timer = setTimeout(() => {
      retry.timer = undefined
      retry.attempt += 1
      if (this.active === active) active.transport?.retryPeer(peerId)
    }, peerRetryDelayMs(retry.attempt))
    active.retries.set(peerId, retry)
  }

  private onSocketStatus(active: Active, status: 'connected' | 'reconnecting' | 'disconnected') {
    if (this.active !== active) return
    if (status === 'connected') {
      if (active.droppedAt !== null) void this.rejoin(active)
      return
    }
    // Socket.IO gave up (signed out, session ended): nothing to come back to.
    if (status === 'disconnected') {
      this.finish(active, null)
      return
    }
    if (active.droppedAt === null) {
      active.droppedAt = Date.now()
      this.deps.store.setState({ status: 'reconnecting' })
    }
  }

  /**
   * The socket is back. The API holds the seat for 30 s; asking for the same room takes it back, and
   * after that it opens a new one. Media connections kept running meanwhile and are not touched.
   */
  private async rejoin(active: Active) {
    active.droppedAt = null
    const { store, realtime } = this.deps
    const state = store.getState()
    try {
      const participants = await realtime.joinRoom({
        roomId: active.roomId,
        muted: isMicSilenced(state),
        deafened: state.deafened,
      })
      if (this.active !== active) return
      store.setState({ status: 'connected' })
      this.applyRoster(active, participants)
    } catch {
      this.finish(active, 'reconnect-failed')
    }
  }

  /** Mic and speakers follow mute and deafen. */
  private applyLocalState(active: Active) {
    const state = this.deps.store.getState()
    const silenced = isMicSilenced(state)
    if (active.mic) active.mic.track.enabled = !silenced
    active.engine?.setDeafened(state.deafened)
    if (!active.mic || !active.watcher) return
    if (silenced && active.watchingSelf) {
      active.watcher.unwatch(active.selfId)
      active.watchingSelf = false
    } else if (!silenced && !active.watchingSelf) {
      active.watcher.watch(active.selfId, active.mic.stream)
      active.watchingSelf = true
    }
  }

  private sendVoiceState() {
    if (this.deps.store.getState().status === 'joining') return
    const state = this.deps.store.getState()
    this.deps.realtime.sendVoiceState({ muted: isMicSilenced(state), deafened: state.deafened }).catch(() => undefined)
  }

  private scheduleIceRenewal(active: Active, delayMs: number | null) {
    if (delayMs === null || this.active !== active) return
    active.iceTimer = setTimeout(async () => {
      try {
        const ice = await this.deps.loadIceConfig(true)
        if (this.active !== active) return
        active.transport?.updateIceServers(ice.iceServers)
        this.scheduleIceRenewal(active, iceRenewalDelayMs(ice.ttlSeconds))
      } catch {
        this.scheduleIceRenewal(active, ICE_RETRY_MS)
      }
    }, delayMs)
  }

  /** The call ended without the user asking (room gone, socket gone, failed to join). */
  private finish(active: Active, notice: VoiceNotice | null) {
    if (this.active !== active) return
    this.release(active, { leaveRoom: false })
    this.reset(notice)
  }

  private setMedia(media: CallMedia | null) {
    this.media = media
    for (const handler of [...this.mediaHandlers]) handler(media)
  }

  private release(active: Active, { leaveRoom }: { leaveRoom: boolean }) {
    if (this.active === active) {
      this.active = null
      this.setMedia(null)
    }
    clearTimeout(active.iceTimer)
    for (const retry of active.retries.values()) clearTimeout(retry.timer)
    for (const stop of active.stops) stop()
    active.watcher?.dispose()
    active.transport?.close()
    active.engine?.dispose()
    if (active.mic) this.deps.stopMicrophone(active.mic)
    if (leaveRoom) this.deps.realtime.leaveRoom().catch(() => undefined)
  }

  /** Back to idle. Volumes stay: they are the user's, not the call's. */
  private reset(notice: VoiceNotice | null) {
    const { store } = this.deps
    const next: VoiceSnapshot = { ...idleVoice, volumes: store.getState().volumes, notice }
    store.setState(next)
  }
}

export { ICE_RETRY_MS, VoiceSession }
export type { SpeakingWatcher, VoiceRealtime, VoiceSessionDeps }
