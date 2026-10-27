import { createBrowserPlatform, type Platform } from '@gameplay/client'

// Until the next ticket moves it to the main process, the chosen server is kept in the storage of the page.
const SERVER_KEY = 'gameplay.server'

function readServer(): string | null {
  try {
    return localStorage.getItem(SERVER_KEY)
  } catch {
    return null
  }
}

/**
 * The desktop host: the browser's capture and rules (Chromium) and a server the user picks. The session is a cookie,
 * as on the web: the main process makes the cookie of the server travel between sites.
 */
function createDesktopPlatform(): Platform {
  const browser = createBrowserPlatform()
  let server = readServer()
  return {
    ...browser,
    kind: 'desktop',
    server: {
      baseUrl: () => server ?? '',
      chooser: {
        current: () => server,
        choose: (origin) => {
          server = origin
          localStorage.setItem(SERVER_KEY, origin)
        },
      },
    },
  }
}

export { createDesktopPlatform }
