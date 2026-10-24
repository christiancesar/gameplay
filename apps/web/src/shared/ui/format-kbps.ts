/** "8.4 Mbps", "640 kbps". */
export function formatKbps(kbps: number) {
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${Math.round(kbps)} kbps`
}
