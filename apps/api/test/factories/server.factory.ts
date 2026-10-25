import type { INestApplication } from '@nestjs/common'
import type { CreateServerRequest } from '@gameplay/contracts'
import { signedIn } from '../support/signed-in'

let sequence = 0

// Body for POST /api/servers.
export function makeServer(overrides: Partial<CreateServerRequest> = {}): CreateServerRequest {
  sequence += 1
  return { name: `Server ${sequence}`, ...overrides }
}

type Options = {
  // People who join through invites (auto-approve), besides the owner.
  members?: number
  // Rooms created after the first one the server is born with.
  extraRooms?: number
}

// A server built through the REST API, with signed-in owner and members.
// Rooms come in position order.
export async function createServerWithMembers(app: INestApplication, { members = 1, extraRooms = 0 }: Options = {}) {
  const owner = await signedIn(app)
  const serverId = (await owner.agent.post('/api/servers').send(makeServer())).body.id as string
  await owner.agent.put(`/api/servers/${serverId}/auto-approve`).send({ autoApprove: true })

  const people = []
  for (let index = 0; index < members; index += 1) {
    const person = await signedIn(app)
    const { code } = (await owner.agent.post(`/api/servers/${serverId}/invites`)).body
    const joined = await person.agent.post(`/api/invites/${code}/join`)
    if (joined.body.result !== 'joined') throw new Error(`Join failed with ${joined.status}`)
    people.push(person)
  }
  for (let index = 0; index < extraRooms; index += 1) {
    const room = await owner.agent.post(`/api/servers/${serverId}/rooms`).send({ name: `Room ${index + 2}` })
    if (room.status !== 201) throw new Error(`Room creation failed with ${room.status}`)
  }

  const rooms = (await owner.agent.get(`/api/servers/${serverId}`)).body.rooms as { id: string }[]
  return { owner, members: people, serverId, roomIds: rooms.map((room) => room.id) }
}
