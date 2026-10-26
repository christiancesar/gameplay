import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'

import { collectRtcStats, installRtcProbe } from '../support/rtc-probe.ts'
import type { RtcStats } from '../support/rtc-probe.ts'
import { postAuth, WEB_ORIGIN } from './auth-api.ts'

/** Chrome flags shared by the bot and by the browser Cypress drives: fake mic, camera and screen, no prompts. */
const FAKE_MEDIA_ARGS = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  '--autoplay-policy=no-user-gesture-required',
  '--auto-select-desktop-capture-source=Entire screen',
  '--enable-usermedia-screen-capturing',
]

/** Source that runs `fn(window)` in the page. The transpiler may wrap functions in `__name`, which the page does not have. */
function inPage(fn: (target: never) => unknown): string {
  return `(() => { const __name = (target) => target; return (${fn.toString()})(window) })()`
}

type BotUser = { email: string; password: string }
type MediaWait = { audio?: boolean; video?: boolean; timeoutMs?: number }

/** A second participant: a headless Chromium signed in as a real user, driven through the real UI. */
class PeerBot {
  private readonly browser: Browser
  private readonly page: Page

  private constructor(browser: Browser, page: Page) {
    this.browser = browser
    this.page = page
  }

  static async start(user: BotUser, serverId: string): Promise<PeerBot> {
    const signedIn = await postAuth('/sign-in/email', { email: user.email, password: user.password })
    if (signedIn.status !== 200) throw new Error(`Bot sign-in failed with ${signedIn.status}`)
    const cookies = signedIn.cookies.split('; ').map((pair) => {
      const [name, ...value] = pair.split('=')
      return { name, value: value.join('='), url: WEB_ORIGIN }
    })

    const browser = await chromium.launch({ args: FAKE_MEDIA_ARGS })
    try {
      const context = await browser.newContext({ permissions: ['microphone'], locale: 'en-US' })
      await context.addCookies(cookies)
      await context.addInitScript(() => localStorage.setItem('i18nextLng', 'en'))
      await context.addInitScript(inPage(installRtcProbe))
      const page = await context.newPage()
      await page.goto(`${WEB_ORIGIN}/servers/${serverId}`)
      await page
        .getByRole('button', { name: /^Join / })
        .first()
        .waitFor({ timeout: 15_000 })
      return new PeerBot(browser, page)
    } catch (error) {
      await browser.close()
      throw error
    }
  }

  async joinRoom(roomName: string) {
    await this.page.getByRole('button', { name: `Join ${roomName}` }).click({ timeout: 10_000 })
    await this.page.getByRole('button', { name: `${roomName}, You are here` }).waitFor({ timeout: 10_000 })
  }

  async leaveRoom() {
    const leave = this.page.getByRole('button', { name: 'Leave room', exact: true })
    if (await leave.count()) await leave.click()
  }

  async setMuted(muted: boolean) {
    await this.page.getByRole('button', { name: muted ? 'Mute' : 'Unmute', exact: true }).click({ timeout: 5000 })
  }

  async startShare() {
    await this.page.getByRole('button', { name: 'Share screen' }).click({ timeout: 5000 })
    await this.page.getByRole('button', { name: 'Choose and share' }).click({ timeout: 5000 })
    await this.page.getByRole('button', { name: 'Stop sharing' }).waitFor({ timeout: 10_000 })
  }

  async stopShare() {
    await this.page.getByRole('button', { name: 'Stop sharing' }).click({ timeout: 5000 })
  }

  async watch() {
    await this.page.getByRole('button', { name: 'Watch', exact: true }).first().click({ timeout: 10_000 })
  }

  async stopWatching() {
    await this.page.getByRole('button', { name: 'Stop watching' }).click({ timeout: 5000 })
  }

  stats(): Promise<RtcStats> {
    return this.page.evaluate(inPage(collectRtcStats)) as Promise<RtcStats>
  }

  /** Polls the counters until every connection is connected and the asked media flows, or throws with the last numbers. */
  async waitForMedia({ audio = true, video = false, timeoutMs = 20_000 }: MediaWait = {}): Promise<RtcStats> {
    const deadline = Date.now() + timeoutMs
    let last = await this.stats()
    for (;;) {
      const connected = last.connectionStates.length > 0 && last.connectionStates.every((s) => s === 'connected')
      const flowing = (!audio || last.audioInboundBytes > 0) && (!video || last.videoFramesDecoded > 0)
      if (connected && flowing) return last
      if (Date.now() > deadline) throw new Error(`Bot media not flowing: ${JSON.stringify(last)}`)
      await this.page.waitForTimeout(500)
      last = await this.stats()
    }
  }

  url(): string {
    return this.page.url()
  }

  async close() {
    await this.browser.close()
  }
}

let current: PeerBot | undefined

function activeBot(): PeerBot {
  if (!current) throw new Error('The peer bot is not running; call bot:start first')
  return current
}

/** The `cy.task` side of the bot. One bot per run. Every task returns something serializable. */
function createBotTasks() {
  return {
    'bot:start': async ({ user, serverId }: { user: BotUser; serverId: string }) => {
      await current?.close()
      current = await PeerBot.start(user, serverId)
      return null
    },
    'bot:joinRoom': async (roomName: string) => (await activeBot().joinRoom(roomName), null),
    'bot:leaveRoom': async () => (await activeBot().leaveRoom(), null),
    'bot:mute': async (muted: boolean) => (await activeBot().setMuted(muted), null),
    'bot:startShare': async () => (await activeBot().startShare(), null),
    'bot:stopShare': async () => (await activeBot().stopShare(), null),
    'bot:watch': async () => (await activeBot().watch(), null),
    'bot:stopWatching': async () => (await activeBot().stopWatching(), null),
    'bot:stats': () => activeBot().stats(),
    'bot:waitForMedia': (wait: MediaWait) => activeBot().waitForMedia(wait),
    'bot:url': () => activeBot().url(),
    'bot:stop': async () => (await stopBot(), null),
  }
}

/** Closes the bot's browser; safe to call when none is running. */
async function stopBot() {
  const bot = current
  current = undefined
  await bot?.close()
}

export { createBotTasks, FAKE_MEDIA_ARGS, stopBot }
export type { BotUser }
