import type { z } from 'zod'

import type { DesktopChannels, DesktopEvents } from './channels'
import { DESKTOP_CHANNELS, type DesktopChannel, type DesktopEvent } from './names'

type Call<K extends DesktopChannel> =
  undefined extends z.input<DesktopChannels[K]['input']>
    ? (input?: z.input<DesktopChannels[K]['input']>) => Promise<z.output<DesktopChannels[K]['output']>>
    : (input: z.input<DesktopChannels[K]['input']>) => Promise<z.output<DesktopChannels[K]['output']>>

/** Listens to an event of the main process; the function it returns stops listening. */
type Subscribe = <E extends DesktopEvent>(event: E, listener: (payload: DesktopEvents[E]) => void) => () => void

/**
 * What the page sees as `window.gameplayDesktop`: one typed function per channel of the contract, and `on` for the
 * events the main process sends by itself. Nothing else.
 */
type DesktopBridge = { [K in DesktopChannel]: Call<K> } & { on: Subscribe }

/** The bridge on top of `ipcRenderer.invoke` and `ipcRenderer.on`, which the preload hands in. */
function createBridge(
  invoke: (channel: DesktopChannel, input: unknown) => Promise<unknown>,
  subscribe: Subscribe,
): DesktopBridge {
  const bridge: Record<string, unknown> = { on: subscribe }
  for (const channel of DESKTOP_CHANNELS) bridge[channel] = (input?: unknown) => invoke(channel, input)
  return bridge as DesktopBridge
}

export { createBridge }
export type { DesktopBridge, Subscribe }
