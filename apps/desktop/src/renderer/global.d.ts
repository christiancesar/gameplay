import type { DesktopBridge } from '@gameplay/desktop-bridge/bridge'

declare global {
  interface Window {
    /** What the preload exposes: the channels of the contract of @gameplay/desktop-bridge. */
    gameplayDesktop: DesktopBridge
  }
}
