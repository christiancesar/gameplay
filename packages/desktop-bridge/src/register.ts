import type { z } from 'zod'

import { desktopChannels, type DesktopChannels } from './channels'
import { DESKTOP_CHANNELS, type DesktopChannel } from './names'

/** What the main process does for each channel, given the input already checked. */
type ChannelHandlers = {
  [K in DesktopChannel]: (
    input: z.output<DesktopChannels[K]['input']>,
  ) => z.input<DesktopChannels[K]['output']> | Promise<z.input<DesktopChannels[K]['output']>>
}

/** The part of Electron's `ipcMain` that is used, so this package needs no Electron. */
type IpcMainLike = {
  handle: (
    channel: string,
    listener: (event: { senderFrame?: { url: string } | null }, input?: unknown) => unknown,
  ) => void
}

/**
 * Answers every channel of the contract and none other. A call is refused unless the page it comes from is
 * trusted; its input and the answer are checked against the schemas.
 */
function registerChannels(ipc: IpcMainLike, handlers: ChannelHandlers, isTrustedPage: (url: string) => boolean): void {
  for (const channel of DESKTOP_CHANNELS) {
    const { input, output } = desktopChannels[channel]
    ipc.handle(channel, async (event, raw) => {
      const page = event.senderFrame?.url
      if (!page || !isTrustedPage(page)) throw new Error(`${channel} refused: it did not come from the app`)
      // One handler per channel, typed by the contract: the loop loses the pairing, so it is put back here.
      const handler = handlers[channel] as (value: unknown) => unknown
      return output.parse(await handler(input.parse(raw)))
    })
  }
}

export { registerChannels }
export type { ChannelHandlers, IpcMainLike }
