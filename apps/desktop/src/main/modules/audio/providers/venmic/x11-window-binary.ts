import { execFileSync } from 'node:child_process'
import { readlinkSync } from 'node:fs'
import { basename } from 'node:path'

/** The source id from desktopCapturer is an X11 window id. Resolve its owning process to a PipeWire binary. */
export function x11WindowBinary(
  sourceId: string,
  run: typeof execFileSync = execFileSync,
  read: typeof readlinkSync = readlinkSync,
): string | null {
  const handle = /^window:(\d+):0$/.exec(sourceId)?.[1]
  if (!handle) return null
  try {
    const property = run('xprop', ['-id', handle, '_NET_WM_PID'], { encoding: 'utf8', timeout: 1000 })
    const pid = /_NET_WM_PID\(CARDINAL\) = (\d+)/.exec(property)?.[1]
    if (!pid) return null
    const binary = basename(read(`/proc/${pid}/exe`))
    return binary || null
  } catch {
    return null
  }
}
