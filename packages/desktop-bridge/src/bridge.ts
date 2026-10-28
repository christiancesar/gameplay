import type { z } from 'zod'

import type { DesktopChannels } from './channels'
import { DESKTOP_CHANNELS, type DesktopChannel } from './names'

type Call<K extends DesktopChannel> =
  undefined extends z.input<DesktopChannels[K]['input']>
    ? (input?: z.input<DesktopChannels[K]['input']>) => Promise<z.output<DesktopChannels[K]['output']>>
    : (input: z.input<DesktopChannels[K]['input']>) => Promise<z.output<DesktopChannels[K]['output']>>

/** What the page sees as `window.gameplayDesktop`: one typed function per channel of the contract, nothing else. */
type DesktopBridge = { [K in DesktopChannel]: Call<K> }

/** The bridge on top of `ipcRenderer.invoke`, which the preload hands in. */
function createBridge(invoke: (channel: DesktopChannel, input: unknown) => Promise<unknown>): DesktopBridge {
  const bridge: Record<string, (input?: unknown) => Promise<unknown>> = {}
  for (const channel of DESKTOP_CHANNELS) bridge[channel] = (input) => invoke(channel, input)
  return bridge as DesktopBridge
}

export { createBridge }
export type { DesktopBridge }
