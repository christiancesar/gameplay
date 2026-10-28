import fs from 'node:fs'

type Options = { maxBytes: number; keep: number }

/**
 * Called once when the app starts: a log above `maxBytes` becomes `.1`, the older ones move up and only `keep`
 * files stay. The app never rotates while it runs, so one session is always in a single file.
 */
export function rotateLog(file: string, { maxBytes, keep }: Options): void {
  if (!fs.existsSync(file) || fs.statSync(file).size <= maxBytes) return
  fs.rmSync(`${file}.${keep}`, { force: true })
  for (let index = keep - 1; index >= 1; index--) {
    if (fs.existsSync(`${file}.${index}`)) fs.renameSync(`${file}.${index}`, `${file}.${index + 1}`)
  }
  fs.renameSync(file, `${file}.1`)
}
