const adminSession = {
  user: {
    id: 'u1',
    name: 'Admin',
    email: 'admin@gameplay.local',
    image: null,
    role: 'admin',
    maxServersOverride: null,
  },
}

const memberSession = {
  user: {
    id: 'u2',
    name: 'Player',
    email: 'player@gameplay.local',
    image: '/avatars/u2.webp',
    role: 'user',
    maxServersOverride: 1,
  },
}

export { adminSession, memberSession }
