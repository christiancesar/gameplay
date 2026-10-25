type DisplaysPermission = 'granted' | 'prompt' | 'denied' | 'unsupported'

/** One monitor as the Window Management API describes it (`ScreenDetailed`). */
type ScreenInfo = {
  label?: string
  width: number
  height: number
  devicePixelRatio: number
  isPrimary?: boolean
  isInternal?: boolean
}

/** The slice of the browser this service needs, so specs can hand in a fake. */
type DisplaysEnv = {
  permissions?: { query: (descriptor: { name: PermissionName }) => Promise<{ state: PermissionState }> }
  /** `window.getScreenDetails`; absent outside Chromium. Calling it asks for permission when not granted yet. */
  getScreenDetails?: () => Promise<{ screens: readonly ScreenInfo[] }>
}

type DisplaysService = {
  permission: () => Promise<DisplaysPermission>
  /** Shows the browser prompt. */
  request: () => Promise<DisplaysPermission>
  /** Only call after the permission is granted, or the browser prompts. */
  readScreens: () => Promise<ScreenInfo[]>
}

// "window-management" is the current name; older Chromium versions know "window-placement".
const PERMISSION_NAMES = ['window-management', 'window-placement'] as const

function createDisplaysService(env: DisplaysEnv): DisplaysService {
  return {
    async permission() {
      if (!env.getScreenDetails) return 'unsupported'
      for (const name of PERMISSION_NAMES) {
        try {
          const status = await env.permissions?.query({ name: name as PermissionName })
          if (status) return status.state
        } catch {
          // Unknown permission name in this browser: try the next one.
        }
      }
      return 'prompt'
    },

    async request() {
      if (!env.getScreenDetails) return 'unsupported'
      try {
        await env.getScreenDetails()
        return 'granted'
      } catch {
        return 'denied'
      }
    },

    async readScreens() {
      const details = await env.getScreenDetails?.()
      return details ? [...details.screens] : []
    },
  }
}

/** Reads `navigator` and `window` at call time. */
const displays = createDisplaysService({
  get permissions() {
    return navigator.permissions
  },
  get getScreenDetails() {
    const source = window as unknown as { getScreenDetails?: DisplaysEnv['getScreenDetails'] }
    return source.getScreenDetails?.bind(window)
  },
})

export { createDisplaysService, displays }
export type { DisplaysEnv, DisplaysPermission, DisplaysService, ScreenInfo }
