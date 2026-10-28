import type { AudioApp, AudioShare } from '@gameplay/desktop-bridge'

import { AppAudioProvider } from '../app-audio.provider'

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
  private patchBay: PatchBayLike | null = null

  constructor(load: () => PatchBayConstructor | null, selfBinary: string) {
    super()
    this.load = load
    this.selfBinary = selfBinary
  }

  available(): boolean {
    try {
      return this.load()?.hasPipeWire() ?? false
    } catch {
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
      return bay.link(
        target.mode === 'apps' ? { ...base, include: target.apps.map((name) => ({ [NAME]: name })) } : base,
      )
    } catch {
      return false
    }
  }

  stop(): void {
    this.patchBay?.unlink()
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
