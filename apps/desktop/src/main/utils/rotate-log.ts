import fs from 'node:fs'

/** `main.log` becomes `.1`, the older ones move up, and only `keep` files stay. */
export function rotateNow(file: string, keep: number): void {
  fs.rmSync(`${file}.${keep}`, { force: true })
  for (let index = keep - 1; index >= 1; index--) {
    if (fs.existsSync(`${file}.${index}`)) fs.renameSync(`${file}.${index}`, `${file}.${index + 1}`)
  }
  if (fs.existsSync(file)) fs.renameSync(file, `${file}.1`)
}

/** Called when the app starts: a log left above `maxBytes` by the last run is rotated before this one begins. */
export function rotateLog(file: string, { maxBytes, keep }: { maxBytes: number; keep: number }): void {
  if (!fs.existsSync(file) || fs.statSync(file).size <= maxBytes) return
  rotateNow(file, keep)
}
