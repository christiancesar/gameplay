import { desktopCapturer, type Session } from 'electron'

/**
 * The source a screen share starts with. On Wayland the system's own picker already ran and `desktopCapturer`
 * answers only what the user chose; elsewhere (X11, Windows) there are several and this takes the first screen.
 */
function pickSource<T extends { id: string }>(sources: readonly T[]): T | null {
  return sources.find((source) => source.id.startsWith('screen:')) ?? sources[0] ?? null
}

/**
 * Without a handler Chromium refuses `getDisplayMedia` inside Electron. This one is the stand-in until the capture
 * ticket brings the app's own picker, with windows, previews and per-app audio: no audio, no choice outside Wayland
 * and macOS 15 (which have a system picker).
 */
function installDisplayMediaHandler(session: Session): void {
  session.setDisplayMediaRequestHandler(
    (_request, callback) => {
      desktopCapturer.getSources({ types: ['screen', 'window'] }).then(
        (sources) => {
          const source = pickSource(sources)
          callback(source ? { video: source } : (null as never))
        },
        // The user closed the system picker, or the system gave no source.
        () => callback(null as never),
      )
    },
    { useSystemPicker: true },
  )
}

export { installDisplayMediaHandler, pickSource }
