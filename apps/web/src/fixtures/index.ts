// Dados fictícios usados só nas stories.
import avatarKisnaider from './images/avatar-kisnaider.webp'
import avatarShinigame from './images/avatar-shinigame.webp'
import serverTurbex from './images/server-turbex.webp'
import streamFrame from './images/stream-frame.webp'

export const images = { avatarKisnaider, avatarShinigame, serverTurbex, streamFrame }

export const me = {
  id: 'u1',
  name: 'Shinigame',
  username: 'shinigame',
  email: 'christian.cesar@gameplay.com',
  avatarUrl: avatarShinigame,
}

export const people = {
  shinigame: me,
  jacutinga: {
    id: 'u2',
    name: 'Jacutinga',
    username: 'jacutinga',
    email: 'jacutinga@gameplay.com',
    avatarUrl: undefined,
  },
  kisnaider: {
    id: 'u3',
    name: 'Kisnaider',
    username: 'kisnaider',
    email: 'kisnaider@gameplay.com',
    avatarUrl: avatarKisnaider,
  },
  marreta: { id: 'u4', name: 'Marreta', username: 'marreta', email: 'marreta@gameplay.com', avatarUrl: undefined },
  lua: { id: 'u5', name: 'LuaNova', username: 'luanova', email: 'lua@gameplay.com', avatarUrl: undefined },
}

export const servers = {
  turbex: { id: 's1', name: 'Turbex', iconUrl: serverTurbex },
  clanZero: { id: 's2', name: 'Clan Zero', iconUrl: undefined },
  sextaFeira: { id: 's3', name: 'Sexta Feira', iconUrl: undefined },
}
