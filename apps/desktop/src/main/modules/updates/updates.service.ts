import type { EventEmitter } from 'node:events'

import type { Logger } from '../logging/logger'

const WINDOWS_UPDATE_FEED_URL = 'https://gameplay.oikos.company/api/updates/windows/stable'
const FIRST_CHECK_DELAY_MS = 10_000

type UpdaterLike = EventEmitter & {
  setFeedURL(options: { url: string }): void
  checkForUpdates(): Promise<unknown> | unknown
}

type UpdateServiceOptions = {
  updater: UpdaterLike
  logger: Logger
  isPackaged: boolean
  platform: NodeJS.Platform
  args: readonly string[]
  feedUrl?: string
  delayMs?: number
}

/** Configures the official Windows feed and never lets a failed check stop the app. */
class UpdatesService {
  private checking = false
  private readonly updater: UpdaterLike
  private readonly logger: Logger
  private readonly options: UpdateServiceOptions

  constructor(options: UpdateServiceOptions) {
    this.options = options
    this.updater = options.updater
    this.logger = options.logger
  }

  start(): void {
    const { args, isPackaged, platform } = this.options
    if (!isPackaged || platform !== 'win32' || args.some((arg) => arg.startsWith('--squirrel-'))) return

    const feedUrl = this.options.feedUrl || WINDOWS_UPDATE_FEED_URL
    this.updater.setFeedURL({ url: feedUrl })
    this.updater.on('checking-for-update', () => this.logger.info({ feedUrl }, 'Checking for desktop update'))
    this.updater.on('update-available', () => this.logger.info({ feedUrl }, 'Desktop update available'))
    this.updater.on('update-not-available', () => {
      this.checking = false
      this.logger.info({ feedUrl }, 'Desktop is up to date')
    })
    this.updater.on('update-downloaded', () => {
      this.checking = false
      this.logger.info({ feedUrl }, 'Desktop update downloaded; it will install on the next restart')
    })
    this.updater.on('error', (error: unknown) => {
      this.checking = false
      this.logger.warn({ err: error, feedUrl }, 'Desktop update check failed')
    })

    setTimeout(() => void this.check(), this.options.delayMs ?? FIRST_CHECK_DELAY_MS)
  }

  private async check(): Promise<void> {
    if (this.checking) return
    this.checking = true
    try {
      await this.updater.checkForUpdates()
    } catch (error) {
      this.checking = false
      this.logger.warn({ err: error }, 'Desktop update request could not start')
    }
  }
}

export { FIRST_CHECK_DELAY_MS, UpdatesService, WINDOWS_UPDATE_FEED_URL }
export type { UpdateServiceOptions, UpdaterLike }
