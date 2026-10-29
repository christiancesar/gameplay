import * as inspector from 'node:inspector'

type CommandLine = { appendSwitch: (name: string, value?: string) => void }
type InspectorApi = {
  open: (port: number, host: string, wait: boolean) => unknown
  close: () => void
  url: () => string | undefined
}
type DevToolsWindow = { webContents: { openDevTools: (options: { mode: 'detach' }) => void } }
type DebuggerContents = {
  debugger: { isAttached: () => boolean; attach: (protocolVersion?: string) => void; detach: () => void }
}

class DebuggingPortError extends Error {
  constructor(kind: string, port: number, cause: unknown) {
    super(`Could not open the local ${kind} on port ${port}. The port may be occupied.`, { cause })
    this.name = 'DebuggingPortError'
  }
}

function configureCdp(commandLine: CommandLine, port: number | null): void {
  if (port === null) return
  commandLine.appendSwitch('remote-debugging-address', '127.0.0.1')
  commandLine.appendSwitch('remote-debugging-port', String(port))
}

function openMainInspector(api: InspectorApi, port: number | null): (() => void) | undefined {
  if (port === null) return undefined
  try {
    api.open(port, '127.0.0.1', false)
  } catch (error) {
    throw new DebuggingPortError('o inspector do processo principal', port, error)
  }
  return () => api.close()
}

function openDevTools(window: DevToolsWindow): void {
  window.webContents.openDevTools({ mode: 'detach' })
}

/** Attaches only when no DevTools/debugger is using the contents; callers own the returned detach operation. */
function attachRendererDebugger(contents: DebuggerContents): (() => void) | undefined {
  if (contents.debugger.isAttached()) return undefined
  contents.debugger.attach('1.3')
  return () => {
    if (contents.debugger.isAttached()) contents.debugger.detach()
  }
}

const nodeInspector: InspectorApi = {
  open: (port, host, wait) => inspector.open(port, host, wait),
  close: () => inspector.close(),
  url: () => inspector.url(),
}

export { DebuggingPortError, attachRendererDebugger, configureCdp, nodeInspector, openDevTools, openMainInspector }
export type { CommandLine, DebuggerContents, DevToolsWindow, InspectorApi }
