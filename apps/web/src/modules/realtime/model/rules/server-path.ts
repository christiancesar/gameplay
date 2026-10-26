/** True when the pathname is the page of that server (`/servers/<id>` or anything below it). */
function isOnServerPath(pathname: string, serverId: string): boolean {
  const base = `/servers/${serverId}`
  return pathname === base || pathname.startsWith(`${base}/`)
}

export { isOnServerPath }
