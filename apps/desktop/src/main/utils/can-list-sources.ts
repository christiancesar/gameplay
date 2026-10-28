/**
 * Whether the app lists the screens and windows itself: Windows and X11. Wayland does not let an app see other
 * programs' windows, and asking `desktopCapturer` there opens the system picker, so the picker is the choice.
 */
export function canListSources(platform: NodeJS.Platform, env: Readonly<Record<string, string | undefined>>): boolean {
  if (platform === 'win32') return true
  if (platform !== 'linux') return false
  return env.XDG_SESSION_TYPE !== 'wayland' && !env.WAYLAND_DISPLAY
}
