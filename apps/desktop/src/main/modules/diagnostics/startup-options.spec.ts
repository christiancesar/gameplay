import { describe, expect, it } from 'vitest'

import { parseDiagnosticsArgs } from './startup-options'

describe('parseDiagnosticsArgs', () => {
  it('keeps every diagnostic endpoint off without arguments', () => {
    expect(parseDiagnosticsArgs(['.'])).toEqual({
      ok: true,
      options: { diagnostics: false, cdpPort: null, mainInspectPort: null, devtools: false },
    })
  })

  it('parses each local option', () => {
    expect(
      parseDiagnosticsArgs(['--diagnostics', '--cdp-port=9223', '--main-inspect-port=9229', '--devtools']),
    ).toEqual({
      ok: true,
      options: { diagnostics: true, cdpPort: 9223, mainInspectPort: 9229, devtools: true },
    })
  })

  it.each(['--cdp-port=80', '--cdp-port=abc', '--main-inspect-port=65536', '--main-inspect-port'])(
    'rejects invalid ports: %s',
    (argument) => {
      expect(parseDiagnosticsArgs([argument])).toMatchObject({ ok: false, error: expect.stringContaining('port') })
    },
  )

  it('rejects duplicates and incompatible options', () => {
    expect(parseDiagnosticsArgs(['--diagnostics', '--diagnostics'])).toMatchObject({
      ok: false,
      error: expect.stringContaining('Duplicate'),
    })
    expect(parseDiagnosticsArgs(['--devtools'])).toMatchObject({
      ok: false,
      error: expect.stringContaining('requires'),
    })
  })
})
