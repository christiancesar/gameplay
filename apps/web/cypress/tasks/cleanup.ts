import { database } from './database.ts'
import { createdKeyHashes } from './test-keys.ts'

/** Removes everything the run created: servers (and their members, rooms, invites), keys, then users. */
async function cleanup(runId: string) {
  const db = database()
  const users = await db.query<{ id: string }>('select id from "user" where username like $1', [`${runId}%`])
  const userIds = users.rows.map((row) => row.id)
  const keyHashes = [...createdKeyHashes]

  await db.query('delete from server where name like $1 or id like $1 or "ownerId" = any($2)', [`${runId}%`, userIds])
  await db.query(
    'delete from registration_invite where id like $3 or "keyHmac" = any($1) or "usedById" = any($2) or "createdById" = any($2)',
    [keyHashes, userIds, `${runId}%`],
  )
  await db.query('delete from "user" where id = any($1)', [userIds])
  createdKeyHashes.clear()
  return countLeft(runId)
}

/** What is still in the database for this run; all zeros after a cleanup. */
async function countLeft(runId: string) {
  const { rows } = await database().query(
    `select
       (select count(*) from "user" where username like $1)::int as users,
       (select count(*) from server where name like $1 or id like $1)::int as servers,
       (select count(*) from registration_invite where id like $1)::int as keys`,
    [`${runId}%`],
  )
  return rows[0] as { users: number; servers: number; keys: number }
}

export { cleanup, countLeft }
