import type { Notification } from '@gameplay/contracts'

const approved: Notification = {
  id: 'n1',
  type: 'join-approved',
  server: { id: 's1', name: 'Turbex' },
  createdAt: '2026-10-25T10:00:00.000Z',
}
const kicked: Notification = {
  id: 'n2',
  type: 'kicked',
  server: { id: 's2', name: 'Clan Zero' },
  createdAt: '2026-10-25T09:00:00.000Z',
}

export { approved, kicked }
