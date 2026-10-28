import type { CaptureSource } from '@gameplay/desktop-bridge'

import type { CaptureSourceProvider } from '../providers/capture-source.provider'

/** The choice lasts for one capture: the page announces it just before it asks for the screen. */
const CHOICE_TTL_MS = 10_000

type Choice = { id: string; at: number }

/** The screens and windows for the picker of the share dialog, and the one the next capture takes. */
export class CaptureSourceService {
  private readonly provider: CaptureSourceProvider
  private readonly now: () => number
  private choice: Choice | null = null
  private names = new Map<string, string>()

  constructor(provider: CaptureSourceProvider, now: () => number = Date.now) {
    this.provider = provider
    this.now = now
  }

  canList(): boolean {
    return this.provider.canList()
  }

  /** Screens first, then windows, each by name. Windows with no title are not worth offering. */
  async list(): Promise<CaptureSource[]> {
    if (!this.provider.canList()) return []
    const sources = (await this.provider.list())
      .filter((source) => source.kind === 'screen' || source.name.trim() !== '')
      .sort((a, b) => kindRank(a) - kindRank(b) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    this.names = new Map(sources.map((source) => [source.id, source.name]))
    return sources
  }

  /** Announces the source the next capture takes; null forgets it. */
  select(id: string | null): void {
    this.choice = id ? { id, at: this.now() } : null
  }

  /** The announced source, once: null when none was, or it has expired. */
  take(): { id: string; name: string } | null {
    const choice = this.choice
    this.choice = null
    if (!choice || this.now() - choice.at > CHOICE_TTL_MS) return null
    return { id: choice.id, name: this.names.get(choice.id) ?? choice.id }
  }
}

function kindRank(source: CaptureSource): number {
  return source.kind === 'screen' ? 0 : 1
}
