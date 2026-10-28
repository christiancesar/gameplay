const MB = 1_000_000
const GB = 1_000_000_000

/** "12.4 GB", "350 MB", na unidade da Cloudflare (base 1000). */
export function formatBytes(bytes: number, locale: string) {
  if (bytes >= GB) return `${(bytes / GB).toLocaleString(locale, { maximumFractionDigits: 2 })} GB`
  return `${(bytes / MB).toLocaleString(locale, { maximumFractionDigits: bytes < MB ? 2 : 0 })} MB`
}
