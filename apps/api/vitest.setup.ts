import { Logger } from '@nestjs/common'

// Unit specs run use-cases that log; keep the output to the test results.
// Specs that assert on a log still spy on Logger.prototype.
Logger.overrideLogger(false)
