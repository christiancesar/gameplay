import { DESKTOP_APP_ORIGIN } from '@gameplay/contracts'

/** The browser origins allowed to use the API with the session cookie. */
function corsOrigins(webOrigin: string, desktopDevOrigin?: string): string[] {
  return [
    ...new Set([webOrigin, desktopDevOrigin, DESKTOP_APP_ORIGIN].filter((origin): origin is string => Boolean(origin))),
  ]
}

/** The Socket.IO adapter reads the environment at connection time, after ConfigModule has loaded `.env`. */
function socketCorsOrigin(origin: string | undefined, callback: (error: null, allowed: boolean) => void): void {
  const allowed = corsOrigins(
    process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    process.env.DESKTOP_DEV_ORIGIN,
  ).includes(origin ?? '')
  callback(null, allowed)
}

export { corsOrigins, socketCorsOrigin }
