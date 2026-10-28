export { createBridge, type DesktopBridge, type Subscribe } from './bridge'
export {
  audioAppSchema,
  audioShareSchema,
  captureSourceSchema,
  systemAudioScopeSchema,
  desktopChannels,
  type AudioApp,
  type AudioShare,
  type CaptureSource,
  type SystemAudioScope,
  type DesktopChannels,
  type DesktopEvents,
} from './channels'
export { DESKTOP_CHANNELS, DESKTOP_EVENTS, type DesktopChannel, type DesktopEvent } from './names'
export { registerChannels, type ChannelHandlers, type IpcMainLike } from './register'
