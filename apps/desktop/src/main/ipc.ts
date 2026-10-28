import { type ChannelHandlers, type IpcMainLike, registerChannels } from '@gameplay/desktop-bridge'

/**
 * Answers the channels of the contract of @gameplay/desktop-bridge. Each module of `modules/` brings its own
 * handlers; the type of `handlers` asks for every channel of the contract, so one without an answer does not build.
 */
export function registerIpc(
  ipc: IpcMainLike,
  handlers: ChannelHandlers,
  isTrustedPage: (url: string) => boolean,
): void {
  registerChannels(ipc, handlers, isTrustedPage)
}
