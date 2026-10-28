import type { CaptureSource } from '@gameplay/desktop-bridge'

import { CaptureSourceProvider } from '../providers/capture-source.provider'

export class FakeCaptureSourceProvider extends CaptureSourceProvider {
  listed = 0
  private readonly listable: boolean
  private readonly sources: CaptureSource[]

  constructor({ canList = true, sources = [] }: { canList?: boolean; sources?: CaptureSource[] } = {}) {
    super()
    this.listable = canList
    this.sources = sources
  }

  canList(): boolean {
    return this.listable
  }

  async list(): Promise<CaptureSource[]> {
    this.listed += 1
    return this.sources
  }
}
