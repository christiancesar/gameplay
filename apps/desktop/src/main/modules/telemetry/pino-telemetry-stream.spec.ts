import { describe, expect, it } from 'vitest'

import { pinoTelemetryStream } from './pino-telemetry-stream'
import { FakeMainTelemetry } from './test/fake-main-telemetry'

const write = (stream: ReturnType<typeof pinoTelemetryStream>, line: unknown) =>
  new Promise<void>((resolve) => stream.write(typeof line === 'string' ? line : JSON.stringify(line), () => resolve()))

describe('pinoTelemetryStream', () => {
  it('sends a line of the log as a log, with what is not pino own as attributes', async () => {
    const telemetry = new FakeMainTelemetry()
    const stream = pinoTelemetryStream(telemetry)

    await write(stream, {
      level: 'warn',
      time: '2026-10-28T01:57:22Z',
      pid: 1,
      msg: 'No PipeWire',
      reason: 'missing',
      target: { mode: 'apps' },
    })

    expect(telemetry.logs).toEqual([
      { level: 'warn', message: 'No PipeWire', attributes: { reason: 'missing', target: '{"mode":"apps"}' } },
    ])
  })

  it('leaves out debug lines, lines with no message and anything that is not JSON', async () => {
    const telemetry = new FakeMainTelemetry()
    const stream = pinoTelemetryStream(telemetry)

    await write(stream, { level: 'debug', msg: 'Renderer console' })
    await write(stream, { level: 'info' })
    await write(stream, 'not json')

    expect(telemetry.logs).toEqual([])
  })
})
