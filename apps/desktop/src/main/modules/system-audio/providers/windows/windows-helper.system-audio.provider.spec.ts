import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FakeHelperProcess } from '../../test/fake-helper-process'
import { WindowsHelperSystemAudioProvider } from './windows-helper.system-audio.provider'

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never

function setup({ executable = 'C:\\app\\helper.exe', exists = true } = {}) {
  const processes: FakeHelperProcess[] = []
  const launch = vi.fn((_executable: string, _args: string[]) => {
    const child = new FakeHelperProcess()
    processes.push(child)
    return child
  })
  const provider = new WindowsHelperSystemAudioProvider(executable, 4242, launch, () => exists, logger)
  return { provider, launch, processes }
}

describe('WindowsHelperSystemAudioProvider', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('is available only with a helper that exists', () => {
    expect(setup().provider.available()).toBe(true)
    expect(setup({ exists: false }).provider.available()).toBe(false)
    expect(setup({ executable: null as never }).provider.available()).toBe(false)
  })

  it('starts the helper leaving out this app, and reports started once it says it captures', async () => {
    const { provider, launch, processes } = setup()
    const onData = vi.fn()

    const started = provider.start(onData, vi.fn())
    processes[0]!.say('capturing (exclude 4242)')

    expect(await started).toBe(true)
    expect(launch).toHaveBeenCalledWith('C:\\app\\helper.exe', ['exclude', '4242'])
    processes[0]!.write(new Uint8Array([9, 9]))
    expect(onData).toHaveBeenCalledWith(new Uint8Array([9, 9]))
  })

  it('reports not started when the helper leaves before it captures', async () => {
    const { provider, processes } = setup()

    const started = provider.start(vi.fn(), vi.fn())
    processes[0]!.say('activate failed: 0x80070057')
    processes[0]!.exit(1)

    expect(await started).toBe(false)
  })

  it('reports not started, and stops the helper, when it says nothing in time', async () => {
    const { provider, processes } = setup()

    const started = provider.start(vi.fn(), vi.fn())
    await vi.advanceTimersByTimeAsync(3001)

    expect(await started).toBe(false)
    expect(processes[0]!.killed).toBe(true)
  })

  it('reports not started when the helper cannot run at all', async () => {
    const { provider, processes } = setup()

    const started = provider.start(vi.fn(), vi.fn())
    processes[0]!.events.emit('error', new Error('spawn EACCES'))

    expect(await started).toBe(false)
  })

  it('tells when the helper ends on its own, and not when it was stopped', async () => {
    const { provider, processes } = setup()
    const onEnd = vi.fn()
    const started = provider.start(vi.fn(), onEnd)
    processes[0]!.say('capturing')
    await started

    processes[0]!.exit(0)
    expect(onEnd).toHaveBeenCalledOnce()

    const second = provider.start(vi.fn(), onEnd)
    processes[1]!.say('capturing')
    await second
    provider.stop()
    processes[1]!.exit(null)
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('closes the helper input and kills it on stop, so it never stays behind', async () => {
    const { provider, processes } = setup()
    const started = provider.start(vi.fn(), vi.fn())
    processes[0]!.say('capturing')
    await started

    provider.stop()

    expect(processes[0]!.stdinClosed).toBe(true)
    expect(processes[0]!.killed).toBe(true)
  })

  it('does not launch where there is no helper', async () => {
    const { provider, launch } = setup({ exists: false })

    expect(await provider.start(vi.fn(), vi.fn())).toBe(false)
    expect(launch).not.toHaveBeenCalled()
  })
})
