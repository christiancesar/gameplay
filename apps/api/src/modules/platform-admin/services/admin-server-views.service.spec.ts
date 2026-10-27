import { makeLimitsContext } from '../../limits/test/limits-context'
import { InMemoryStorageProvider } from '../../storage/providers/storage/in-memory/in-memory.storage.provider'
import type { AdminServerRecord } from '../domain/admin-records'
import { AdminServerViewsService } from './admin-server-views.service'

const server = (id: string, overrides: Partial<AdminServerRecord> = {}): AdminServerRecord => ({
  id,
  name: id,
  iconKey: null,
  owner: { id: 'owner', username: 'owner' },
  memberCount: 1,
  roomCount: 1,
  maxMembersOverride: null,
  maxRoomsOverride: null,
  createdAt: new Date(1),
  ...overrides,
})

describe('AdminServerViewsService', () => {
  it('shows the override and the limit in force, which is the default without one', async () => {
    const { limits } = makeLimitsContext()
    const views = new AdminServerViewsService(new InMemoryStorageProvider(), limits)

    const [plain, custom] = await views.viewAll([
      server('a'),
      server('b', { maxMembersOverride: 30, maxRoomsOverride: 0 }),
    ])

    expect(plain).toMatchObject({
      maxMembersOverride: null,
      maxRoomsOverride: null,
      effectiveMaxMembers: 10,
      effectiveMaxRooms: 2,
    })
    expect(custom).toMatchObject({
      maxMembersOverride: 30,
      maxRoomsOverride: 0,
      effectiveMaxMembers: 30,
      effectiveMaxRooms: 0,
    })
  })
})
