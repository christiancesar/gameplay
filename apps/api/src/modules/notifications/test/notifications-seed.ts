import type { ServerRecord } from '../../servers/domain/server'

// The notifications unit tests start with one server, "Turbex".
export const SEED_SERVER: ServerRecord = {
  id: 's1',
  name: 'Turbex',
  description: null,
  iconKey: null,
  coverKey: null,
  autoApprove: false,
  ownerId: 'ana',
  createdAt: new Date(0),
}
