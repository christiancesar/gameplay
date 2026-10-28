import type { AudioApp, AudioShare } from '@gameplay/desktop-bridge'

// Where the sound of an application comes from, and how it is made available to the page.
export abstract class AppAudioProvider {
  // Whether this system can do it at all (no PipeWire, or the native module missing, is no).
  abstract available(): boolean
  // The applications playing sound now, the app itself left out.
  abstract list(): AudioApp[]
  // Makes the chosen sound available as a virtual microphone. False when it could not.
  abstract share(target: AudioShare): boolean
  // Takes the virtual microphone down.
  abstract stop(): void
}
