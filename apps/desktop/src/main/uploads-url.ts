/**
 * Where `/uploads/...` of the app is on the server. The server answers images and files with paths of its own
 * origin (`/uploads/avatars/x.png`), which on `app://gameplay` would lead nowhere: the app asks the server for
 * them. Null when there is no server yet or the path is not under `/uploads/`.
 */
function uploadsUrl(server: string | null, requestUrl: string): string | null {
  if (!server) return null
  const { pathname, search } = new URL(requestUrl)
  if (!pathname.startsWith('/uploads/')) return null
  const target = new URL(`${pathname}${search}`, server)
  // The address is already normalized (`..` resolved): this only confirms it stayed under /uploads/ on the server.
  return target.origin === server && target.pathname.startsWith('/uploads/') ? target.toString() : null
}

export { uploadsUrl }
