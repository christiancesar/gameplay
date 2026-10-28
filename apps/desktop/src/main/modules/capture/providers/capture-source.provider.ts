import type { CaptureSource } from '@gameplay/desktop-bridge'

// Where the screens and windows that can be shared come from.
export abstract class CaptureSourceProvider {
  // Whether the app can list them itself. On Wayland only the system picker knows, and listing would open it.
  abstract canList(): boolean
  // The screens and windows now, with a preview, the app's own windows left out.
  abstract list(): Promise<CaptureSource[]>
}
