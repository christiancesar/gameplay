import type { SystemAudioScope } from '@gameplay/desktop-bridge'

// Where the sound of the computer, without the app's own, comes from, as PCM s16le 48 kHz stereo.
export abstract class SystemAudioProvider {
  // Whether this system can do it at all (Windows with the capture helper next to the app).
  abstract available(): boolean
  // Starts the capture of the scope (the computer without the app, or the application of a window); `onData` gets the PCM in
  // pieces and `onEnd` is told when it stops on its own. False when it could not start.
  abstract start(onData: (chunk: Uint8Array) => void, onEnd: () => void, scope: SystemAudioScope): Promise<boolean>
  // Stops the capture; nothing to do when none is running.
  abstract stop(): void
}
