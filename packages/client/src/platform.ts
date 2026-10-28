// What a host (the web, the desktop app) needs to build its own Platform: the interface and the pieces a host with
// a browser inside shares. Kept apart from the entry of the app so a host's specs do not load the whole front-end.
export { acquireScreen, stopScreen } from './shared/media/screen-capture'
export type { GetDisplayMedia, ScreenCaptureHandle, ScreenCaptureResult } from './shared/media/screen-capture'
export { audioCapabilitiesOf } from './modules/screen-share/model/rules/audio-capabilities'
export type { CapturePlatformSource } from './modules/screen-share/model/rules/capture-platform'
export type {
  AudioApp,
  CaptureRequest,
  CaptureSource,
  Platform,
  PlatformCapabilities,
  PlatformServer,
  TelemetryConfig,
} from './shared/platform/platform'
