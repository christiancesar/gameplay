type DiagnosticsStartupOptions = {
  diagnostics: boolean
  cdpPort: number | null
  mainInspectPort: number | null
  devtools: boolean
}

type ParseResult = { ok: true; options: DiagnosticsStartupOptions } | { ok: false; error: string }

const DEFAULT_OPTIONS: DiagnosticsStartupOptions = {
  diagnostics: false,
  cdpPort: null,
  mainInspectPort: null,
  devtools: false,
}

function portOf(argument: string, name: string): number | string {
  const prefix = `${name}=`
  if (!argument.startsWith(prefix)) return `Invalid argument: use ${prefix}<port>`
  const value = argument.slice(prefix.length)
  const port = Number(value)
  if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1024 || port > 65_535)
    return `Invalid port in ${name}: use a number between 1024 and 65535`
  return port
}

function parseDiagnosticsArgs(args: readonly string[]): ParseResult {
  const options = { ...DEFAULT_OPTIONS }
  const seen = new Set<string>()
  for (const argument of args) {
    const name = argument.split('=', 1)[0]
    if (!['--diagnostics', '--cdp-port', '--main-inspect-port', '--devtools'].includes(name)) continue
    if (seen.has(name)) return { ok: false, error: `Duplicate argument: ${name}` }
    seen.add(name)
    if (name === '--diagnostics') options.diagnostics = true
    else if (name === '--devtools') options.devtools = true
    else {
      const port = portOf(argument, name)
      if (typeof port === 'string') return { ok: false, error: port }
      if (name === '--cdp-port') options.cdpPort = port
      else options.mainInspectPort = port
    }
  }
  if (options.devtools && !options.diagnostics)
    return { ok: false, error: 'Invalid combination: --devtools requires --diagnostics' }
  return { ok: true, options }
}

export { DEFAULT_OPTIONS, parseDiagnosticsArgs }
export type { DiagnosticsStartupOptions, ParseResult }
