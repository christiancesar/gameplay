import type { Notification } from '@gameplay/contracts'

const approved = {
  id: 'n1',
  type: 'join-approved',
  server: { id: 's1', name: 'Turbex' },
  createdAt: '2026-10-25T10:00:00.000Z',
} satisfies Notification
const kicked = {
  id: 'n2',
  type: 'kicked',
  server: { id: 's2', name: 'Clan Zero' },
  createdAt: '2026-10-25T09:00:00.000Z',
} satisfies Notification

const maintenance = {
  id: 'n3',
  type: 'platform-announcement',
  announcement: { title: 'Manutenção às 22h', message: 'O app fica fora do ar por uns 10 minutos.' },
  createdAt: '2026-10-25T08:00:00.000Z',
} satisfies Notification

export { approved, kicked, maintenance }
