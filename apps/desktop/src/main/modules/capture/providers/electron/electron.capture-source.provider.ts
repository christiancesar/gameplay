import type { CaptureSource } from '@gameplay/desktop-bridge'
import { desktopCapturer } from 'electron'

import { canListSources } from '../../../../utils/can-list-sources'
import { toCaptureSource } from '../../mappers/capture-source.mapper'
import { CaptureSourceProvider } from '../capture-source.provider'

/** Small enough to list a few dozen windows quickly (about 200 ms for four), large enough for a card. */
const THUMBNAIL_SIZE = { width: 320, height: 180 }

/** The screens and windows `desktopCapturer` sees: on Windows and X11. */
export class ElectronCaptureSourceProvider extends CaptureSourceProvider {
  private readonly ownSourceIds: () => string[]

  /** `ownSourceIds`: the ids of this app's own windows, which must not be offered. */
  constructor(ownSourceIds: () => string[]) {
    super()
    this.ownSourceIds = ownSourceIds
  }

  canList(): boolean {
    return canListSources(process.platform, process.env)
  }

  async list(): Promise<CaptureSource[]> {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: THUMBNAIL_SIZE,
      fetchWindowIcons: true,
    })
    const own = new Set(this.ownSourceIds())
    return sources.filter((source) => !own.has(source.id)).map(toCaptureSource)
  }
}
