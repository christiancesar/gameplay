import { vi } from 'vitest'

/** Replaces the `qrcode` package: the data URL is predictable. */
const fakeQrCodeModule = {
  default: { toDataURL: vi.fn(async (text: string) => `data:image/png;qr,${text.length}`) },
}

export { fakeQrCodeModule }
