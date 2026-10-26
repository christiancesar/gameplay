/** Deafen also silences the microphone, without losing the mute the user chose. */
function isMicSilenced(state: { muted: boolean; deafened: boolean }): boolean {
  return state.muted || state.deafened
}

export { isMicSilenced }
