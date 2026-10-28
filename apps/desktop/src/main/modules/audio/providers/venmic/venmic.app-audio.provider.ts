import type { AudioApp, AudioShare } from '@gameplay/desktop-bridge'

import { type Logger, silentLogger } from '../../../logging/logger'
import { AppAudioProvider } from '../app-audio.provider'
import { x11WindowBinary } from './x11-window-binary'

type Node = Record<string, string>

/** The part of `@vencord/venmic` that is used: PipeWire nodes, listed and linked to a virtual microphone. */
type PatchBayLike = {
  list: (properties: string[]) => Node[]
  link: (data: { include?: Node[]; exclude?: Node[]; ignore_devices?: boolean; only_speakers?: boolean }) => boolean
  unlink: () => void
}
type PatchBayConstructor = (new () => PatchBayLike) & { hasPipeWire: () => boolean }

const NAME = 'application.name'
const BINARY = 'application.process.binary'

/**
 * PipeWire through `@vencord/venmic`. The module is native and Linux only, so it is loaded on first use and
 * everything answers "no" when it is not there.
 */
export class VenmicAppAudioProvider extends AppAudioProvider {
  private readonly load: () => PatchBayConstructor | null
  private readonly selfBinary: string
  private readonly logger: Logger
  private patchBay: PatchBayLike | null = null
  private reported = false

  constructor(load: () => PatchBayConstructor | null, selfBinary: string, logger: Logger = silentLogger) {
    super()
    this.load = load
    this.selfBinary = selfBinary
    this.logger = logger
  }

  available(): boolean {
    try {
      const pipewire = this.load()?.hasPipeWire() ?? false
      this.report(pipewire ? 'PipeWire found, app audio is available' : 'No PipeWire, app audio is off')
      return pipewire
    } catch (err) {
      this.report('Could not check PipeWire, app audio is off', err)
      return false
    }
  }

  list(): AudioApp[] {
    const bay = this.bay()
    if (!bay) return []
    const apps = new Map<string, AudioApp>()
    for (const node of bay.list([NAME, BINARY])) {
      const name = node[NAME]
      const binary = node[BINARY] ?? null
      if (!name || binary === this.selfBinary) continue
      if (!apps.has(name)) apps.set(name, { name, binary })
    }
    this.logger.debug({ apps: [...apps.keys()] }, 'Applications playing sound')
    return [...apps.values()]
  }

  share(target: AudioShare): boolean {
    const bay = this.bay()
    if (!bay) return false
    // A new choice replaces the old one; the app's own sound (the call) is never part of it.
    bay.unlink()
    const exclude = [{ [BINARY]: this.selfBinary }]
    const base = { exclude, ignore_devices: true, only_speakers: true }
    try {
      const binary = target.mode === 'window' ? x11WindowBinary(target.sourceId) : null
      const linked = bay.link(
        target.mode === 'apps'
          ? { ...base, include: target.apps.map((name) => ({ [NAME]: name })) }
          : target.mode === 'window' && binary && binary !== this.selfBinary
            ? { ...base, include: [{ [BINARY]: binary }] }
            : base,
      )
      this.logger.info({ target, linked }, 'Linked application audio to the virtual microphone')
      return linked
    } catch (err) {
      this.logger.error({ err, target }, 'Could not link application audio')
      return false
    }
  }

  stop(): void {
    this.patchBay?.unlink()
    this.logger.info('Unlinked application audio')
  }

  /** What the system offers does not change while the app runs, so it is said once. */
  private report(message: string, err?: unknown): void {
    if (this.reported) return
    this.reported = true
    if (err) this.logger.warn({ err }, message)
    else this.logger.info(message)
  }

  private bay(): PatchBayLike | null {
    if (this.patchBay) return this.patchBay
    const Ctor = this.available() ? this.load() : null
    if (!Ctor) return null
    this.patchBay = new Ctor()
    return this.patchBay
  }
}

export type { PatchBayConstructor, PatchBayLike }
