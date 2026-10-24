// Dados fictícios usados só nas stories.
import avatarKisnaider from './images/avatar-kisnaider.webp'
import avatarShinigame from './images/avatar-shinigame.webp'
import serverTurbex from './images/server-turbex.webp'
import streamFrame from './images/stream-frame.webp'

export const images = { avatarKisnaider, avatarShinigame, serverTurbex, streamFrame }

export const me = {
  id: 'u1',
  name: 'Shinigame',
  email: 'christian.cesar@gameplay.com',
  avatarUrl: avatarShinigame,
}

export const people = {
  shinigame: me,
  jacutinga: { id: 'u2', name: 'Jacutinga', email: 'jacutinga@gameplay.com', avatarUrl: undefined },
  kisnaider: { id: 'u3', name: 'Kisnaider', email: 'kisnaider@gameplay.com', avatarUrl: avatarKisnaider },
  marreta: { id: 'u4', name: 'Marreta', email: 'marreta@gameplay.com', avatarUrl: undefined },
  lua: { id: 'u5', name: 'Lua Nova', email: 'lua@gameplay.com', avatarUrl: undefined },
}

export const servers = {
  turbex: { id: 's1', name: 'Turbex', iconUrl: serverTurbex },
  clanZero: { id: 's2', name: 'Clan Zero', iconUrl: undefined },
  sextaFeira: { id: 's3', name: 'Sexta Feira', iconUrl: undefined },
}
