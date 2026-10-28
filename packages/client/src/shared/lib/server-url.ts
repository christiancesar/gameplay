/** A path the server serves (the monitoring tunnels), on the server's origin. A full URL stays as it is. */
function onServer(url: string, serverUrl: string): string {
  return /^https?:\/\//.test(url) ? url : `${serverUrl}${url}`
}

export { onServer }
