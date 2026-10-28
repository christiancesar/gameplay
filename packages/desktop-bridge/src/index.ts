export { createBridge, type DesktopBridge } from './bridge'
export {
  audioAppSchema,
  audioShareSchema,
  captureSourceSchema,
  desktopChannels,
  type AudioApp,
  type AudioShare,
  type CaptureSource,
  type DesktopChannels,
} from './channels'
export { DESKTOP_CHANNELS, type DesktopChannel } from './names'
export { registerChannels, type ChannelHandlers, type IpcMainLike } from './register'
