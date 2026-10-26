const family = (ip: string) => (ip.includes(':') ? 6 : 4)

/**
 * The API saw `requestIp`; STUN saw `stunIps`. A VPN or proxy shows when none of the STUN
 * addresses of the same family match. Different families never count (a dual stack machine can
 * reach the API over IPv4 and STUN over IPv6), and no data means no notice. *(suposição)*
 */
function isVpnDetected(stunIps: readonly string[], requestIp: string | null): boolean {
  if (!requestIp) return false
  const comparable = stunIps.filter((ip) => family(ip) === family(requestIp))
  if (comparable.length === 0) return false
  return !comparable.some((ip) => ip.toLowerCase() === requestIp.toLowerCase())
}

export { isVpnDetected }
