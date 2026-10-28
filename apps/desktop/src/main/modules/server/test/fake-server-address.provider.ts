import { ServerAddressProvider } from '../providers/server-address.provider'

export class FakeServerAddressProvider extends ServerAddressProvider {
  writes: string[] = []
  private kept: string | null

  constructor(kept: string | null = null) {
    super()
    this.kept = kept
  }

  async read(): Promise<string | null> {
    return this.kept
  }

  async write(origin: string): Promise<void> {
    this.kept = origin
    this.writes.push(origin)
  }
}
