import { desktopCapturer, type Session } from 'electron'

import type { Logger } from '../logging/logger'
import type { CaptureSourceService } from './services/capture-source.service'

/**
 * The source a screen share starts with. On Wayland the system's own picker already ran and `desktopCapturer`
 * answers only what the user chose; elsewhere (X11, Windows) there are several and this takes the first screen.
 */
function pickSource<T extends { id: string }>(sources: readonly T[]): T | null {
  return sources.find((source) => source.id.startsWith('screen:')) ?? sources[0] ?? null
}

/**
 * Without a handler Chromium refuses `getDisplayMedia` inside Electron. The source is the one the user picked in
 * the share dialog (announced just before the request); without one, which is Wayland or a page that did not
 * announce, the system picker's answer or the first screen. No audio here: the applications' sound goes through a
 * virtual microphone, and the system's (Windows) is DESK-09.
 */
function installDisplayMediaHandler(session: Session, sources: CaptureSourceService, logger: Logger): void {
  session.setDisplayMediaRequestHandler(
    (_request, callback) => {
      const chosen = sources.take()
      if (chosen) {
        logger.info({ source: chosen.id, name: chosen.name }, 'Screen share source chosen by the user')
        callback({ video: chosen })
        return
      }
      desktopCapturer.getSources({ types: ['screen', 'window'] }).then(
        (sources) => {
          const source = pickSource(sources)
          logger.info({ source: source?.id, name: source?.name, offered: sources.length }, 'Screen share source chosen')
          callback(source ? { video: source } : (null as never))
        },
        // The user closed the system picker, or the system gave no source.
        (err) => {
          logger.warn({ err }, 'No screen share source')
          callback(null as never)
        },
      )
    },
    { useSystemPicker: true },
  )
}

export { installDisplayMediaHandler, pickSource }
