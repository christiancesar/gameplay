import { SfuNotConfiguredError } from '../../../errors/media.errors'
import { SfuProvider } from '../sfu.provider'

// Without CLOUDFLARE_SFU_APP_ID and CLOUDFLARE_SFU_APP_TOKEN: screen share
// stays on mesh.
export class NotConfiguredSfuProvider extends SfuProvider {
  readonly configured = false
  readonly name = null

  newSession(): never {
    throw new SfuNotConfiguredError()
  }
  publish(): never {
    throw new SfuNotConfiguredError()
  }
  pull(): never {
    throw new SfuNotConfiguredError()
  }
  renegotiate(): never {
    throw new SfuNotConfiguredError()
  }
  setLayer(): never {
    throw new SfuNotConfiguredError()
  }
  close(): never {
    throw new SfuNotConfiguredError()
  }
}
