export { createBridge, type DesktopBridge } from './bridge'
export {
  audioAppSchema,
  audioShareSchema,
  desktopChannels,
  type AudioApp,
  type AudioShare,
  type DesktopChannels,
} from './channels'
export { DESKTOP_CHANNELS, type DesktopChannel } from './names'
export { registerChannels, type ChannelHandlers, type IpcMainLike } from './register'
