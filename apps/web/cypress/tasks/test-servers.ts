import { randomBytes } from 'node:crypto'

import { database } from './database.ts'

const HOUR_MS = 60 * 60 * 1000
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

type CreateServerInput = { name: string; ownerId: string; autoApprove?: boolean }

/** Inserts a server with its owner member and a first room, like the API does when it creates one. */
async function createServer(runId: string, { name, ownerId, autoApprove = false }: CreateServerInput) {
  const db = database()
  const id = `${runId}_srv_${randomBytes(4).toString('hex')}`
  await db.query('insert into server (id, name, "autoApprove", "ownerId") values ($1, $2, $3, $4)', [
    id,
    name,
    autoApprove,
    ownerId,
  ])
  await db.query(`insert into server_member ("serverId", "userId", role) values ($1, $2, 'OWNER')`, [id, ownerId])
  await db.query('insert into room (id, "serverId", name, position) values ($1, $2, $3, 0)', [
    `${id}_room`,
    id,
    'Room 1',
  ])
  return { id, name }
}

/** Single-use invite valid for one hour; returns the 8 character code. */
async function createServerInvite(runId: string, input: { serverId: string; createdById: string }) {
  const bytes = randomBytes(8)
  const code = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('')
  await database().query(
    'insert into server_invite (id, "serverId", code, "createdById", "expiresAt") values ($1, $2, $3, $4, $5)',
    [
      `${runId}_inv_${randomBytes(4).toString('hex')}`,
      input.serverId,
      code,
      input.createdById,
      new Date(Date.now() + HOUR_MS).toISOString(),
    ],
  )
  return code
}

/** Adds an existing user to a server as a plain member. */
async function addMember(input: { serverId: string; userId: string }) {
  await database().query(`insert into server_member ("serverId", "userId", role) values ($1, $2, 'MEMBER')`, [
    input.serverId,
    input.userId,
  ])
  return null
}

/** Adds another voice room after the first one. */
async function createRoom(runId: string, input: { serverId: string; name: string; position: number }) {
  const id = `${runId}_room_${randomBytes(4).toString('hex')}`
  await database().query('insert into room (id, "serverId", name, position) values ($1, $2, $3, $4)', [
    id,
    input.serverId,
    input.name,
    input.position,
  ])
  return { id, name: input.name }
}

/** Lets a spec read what the app did: the member rows of a server. */
async function getMembers(serverId: string) {
  const { rows } = await database().query(
    `select u.username, m.role from server_member m join "user" u on u.id = m."userId" where m."serverId" = $1`,
    [serverId],
  )
  return rows
}

export { addMember, createRoom, createServer, createServerInvite, getMembers }
export type { CreateServerInput }
