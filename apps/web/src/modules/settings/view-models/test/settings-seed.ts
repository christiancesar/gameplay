/** The session `GET /api/auth/get-session` returns for a regular user, as far as settings reads it. */
const sessionUser = {
  id: 'u1',
  name: 'turbex',
  email: 'turbex@gameplay.local',
  username: 'turbex',
  displayUsername: 'Turbex',
  image: '/avatars/u1/old.webp' as string | null,
  theme: 'dark' as string | null,
  locale: null as string | null,
}

const sessionData = { session: { id: 's1', userId: 'u1' }, user: sessionUser }

const microphones = [
  { id: 'mic-1', label: 'HyperX Cloud II Microphone' },
  { id: 'mic-2', label: 'Webcam C920 Microphone' },
]
const outputs = [
  { id: 'out-1', label: 'HyperX Cloud II' },
  { id: 'out-2', label: 'Monitor speakers (HDMI)' },
]

export { microphones, outputs, sessionData, sessionUser }
