const COMMON = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "media-src 'self' blob:",
  // Sentry compresses its replays in a worker made from a blob (scripts still only come from the app itself).
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
]

/** The same origin on the socket scheme: https becomes wss, http becomes ws. */
function socketOrigin(origin: string): string {
  return origin.replace(/^http/, 'ws')
}

/**
 * What the pages of the app may load. The scripts, frames and plugins are the app's own. The connections depend on
 * the build: with a server fixed in it the connections stay on that server; without one (development) the user picks
 * the server at run time, so they are open to https and to this machine. Images come from https in both: the server
 * hands out absolute links to where the uploads live (the S3 bucket in production), and an image runs no code.
 */
function contentSecurityPolicy(fixedServer: string | null): string {
  const policy = fixedServer
    ? ["img-src 'self' data: blob: https:", `connect-src 'self' ${fixedServer} ${socketOrigin(fixedServer)}`]
    : [
        "img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*",
        "connect-src 'self' https: wss: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
      ]
  return [...COMMON, ...policy].join('; ')
}

export { contentSecurityPolicy }
