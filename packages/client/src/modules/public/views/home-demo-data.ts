const HOME_DEMO_USER = {
  id: 'demo-user',
  name: 'Shinigame',
  email: 'shinigame@gameplay.local',
}

const HOME_DEMO_SERVERS = [
  { id: 'turbex', name: 'Turbex' },
  { id: 'clan-zero', name: 'Clan Zero' },
]

const HOME_DEMO_ROOMS = [
  {
    id: 'room-01',
    name: 'Room 01',
    participants: [
      { id: 'demo-user', name: 'Shinigame', isMuted: false, isDeafened: false, isSpeaking: true, isLive: false },
      { id: 'alex', name: 'Alex', isMuted: false, isDeafened: false, isSpeaking: false, isLive: true },
    ],
  },
  { id: 'room-02', name: 'Room 02', participants: [] },
]

const HOME_DEMO_STAGE = [
  {
    id: 'demo-user',
    name: 'Shinigame',
    isMe: true,
    isMuted: false,
    isDeafened: false,
    isSpeaking: true,
    isLive: false,
    connection: 'connected' as const,
    volume: 100,
  },
  {
    id: 'alex',
    name: 'Alex',
    isMe: false,
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    isLive: true,
    connection: 'connected' as const,
    volume: 100,
  },
]

const HOME_DEMO_MEMBERS = [
  { id: 'demo-user', name: 'Shinigame', role: 'owner' as const, isOnline: true },
  { id: 'alex', name: 'Alex', role: 'member' as const, isOnline: true },
  { id: 'clara', name: 'Clara', role: 'member' as const, isOnline: false },
]

const HOME_DEMO_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT' },
]

export {
  HOME_DEMO_LANGUAGE_OPTIONS,
  HOME_DEMO_MEMBERS,
  HOME_DEMO_ROOMS,
  HOME_DEMO_SERVERS,
  HOME_DEMO_STAGE,
  HOME_DEMO_USER,
}
