import pino from 'pino'

/** What the rest of the main process knows of the logger: the levels, nothing of where the lines go. */
type Logger = Pick<pino.Logger, 'debug' | 'info' | 'warn' | 'error'>

/** For code that logs when it is given a logger and says nothing otherwise. */
const silentLogger: Logger = pino({ enabled: false })

export { silentLogger }
export type { Logger }
