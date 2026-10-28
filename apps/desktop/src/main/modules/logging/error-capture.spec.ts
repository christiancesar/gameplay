import { EventEmitter } from 'node:events'
import type { App, WebContents } from 'electron'
import { describe, expect, it } from 'vitest'

import { captureContents, captureErrors } from './error-capture'
import { FakeLogger } from './test/fake-logger'

const contents = (url = 'app://gameplay/') => Object.assign(new EventEmitter(), { getURL: () => url })

describe('captureErrors', () => {
  it('logs what goes wrong in the main process and the other processes', () => {
    const logger = new FakeLogger()
    const app = new EventEmitter()
    const proc = new EventEmitter()
    captureErrors(logger, { app: app as unknown as App, proc: proc as unknown as NodeJS.Process })

    proc.emit('uncaughtExceptionMonitor', new Error('boom'), 'uncaughtException')
    proc.emit('unhandledRejection', new Error('late'))
    app.emit('render-process-gone', {}, contents(), { reason: 'crashed', exitCode: 11 })
    app.emit('child-process-gone', {}, { type: 'GPU', reason: 'killed', exitCode: 9, name: 'gpu' })

    expect(logger.entries.map((entry) => [entry.level, entry.message])).toEqual([
      ['error', 'Uncaught exception in the main process'],
      ['error', 'Unhandled promise rejection in the main process'],
      ['error', 'Renderer process gone'],
      ['error', 'Child process gone'],
    ])
    expect(logger.entries[2]?.data).toMatchObject({ reason: 'crashed', exitCode: 11, url: 'app://gameplay/' })
  })

  it('does not call a window that closed normally a failure', () => {
    const logger = new FakeLogger()
    const app = new EventEmitter()
    captureErrors(logger, { app: app as unknown as App, proc: new EventEmitter() as unknown as NodeJS.Process })

    app.emit('render-process-gone', {}, contents(), { reason: 'clean-exit', exitCode: 0 })

    expect(logger.entries.map((entry) => entry.level)).toEqual(['debug'])
  })

  it('does not call the helpers that stop while the app quits a failure', () => {
    const logger = new FakeLogger()
    const app = new EventEmitter()
    captureErrors(logger, { app: app as unknown as App, proc: new EventEmitter() as unknown as NodeJS.Process })

    app.emit('before-quit')
    app.emit('child-process-gone', {}, { type: 'Utility', reason: 'killed', exitCode: 15, name: 'Network Service' })

    expect(logger.entries.map((entry) => entry.level)).toEqual(['debug'])
  })

  it('watches every window that is created', () => {
    const logger = new FakeLogger()
    const app = new EventEmitter()
    captureErrors(logger, { app: app as unknown as App, proc: new EventEmitter() as unknown as NodeJS.Process })
    const window = contents()

    app.emit('web-contents-created', {}, window)
    window.emit('unresponsive')

    expect(logger.entries.map((entry) => entry.message)).toEqual(['Window stopped responding'])
  })
})

describe('captureContents', () => {
  it('logs the console of the page by severity', () => {
    const logger = new FakeLogger()
    const window = contents()
    captureContents(logger, window as unknown as WebContents)

    window.emit('console-message', {
      level: 'error',
      message: 'TypeError: x',
      lineNumber: 7,
      sourceId: 'app://gameplay/a.js',
    })
    window.emit('console-message', { level: 'warning', message: 'careful', lineNumber: 1, sourceId: 'a.js' })
    window.emit('console-message', { level: 'info', message: 'hello', lineNumber: 1, sourceId: 'a.js' })

    expect(logger.entries.map((entry) => entry.level)).toEqual(['error', 'warn', 'debug'])
    expect(logger.entries[0]?.data).toEqual({ source: 'app://gameplay/a.js', line: 7, message: 'TypeError: x' })
  })

  it('leaves out what the DevTools say about themselves', () => {
    const logger = new FakeLogger()
    const window = contents()
    captureContents(logger, window as unknown as WebContents)

    window.emit('console-message', {
      level: 'error',
      message: 'Autofill.enable failed',
      lineNumber: 1,
      sourceId: 'devtools://devtools/bundled/core.js',
    })

    expect(logger.entries).toEqual([])
  })

  it('logs a page that failed to load, but not a navigation the app cancelled', () => {
    const logger = new FakeLogger()
    const window = contents()
    captureContents(logger, window as unknown as WebContents)

    window.emit('did-fail-load', {}, -3, 'ERR_ABORTED', 'https://x.test', true)
    window.emit('did-fail-load', {}, -105, 'ERR_NAME_NOT_RESOLVED', 'https://x.test', true)

    expect(logger.entries).toHaveLength(1)
    expect(logger.entries[0]?.data).toMatchObject({ errorCode: -105, isMainFrame: true })
  })
})
