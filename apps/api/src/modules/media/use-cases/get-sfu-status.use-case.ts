import { Injectable } from '@nestjs/common'
import type { SfuStatusResponse } from '@gameplay/contracts'
import { SfuProvider } from '../sfu.provider'

// Whether the web may offer screen share through the server.
@Injectable()
export class GetSfuStatusUseCase {
  constructor(private readonly provider: SfuProvider) {}

  execute(): SfuStatusResponse {
    return this.provider.configured ? { available: true, reason: null } : { available: false, reason: 'not-configured' }
  }
}
