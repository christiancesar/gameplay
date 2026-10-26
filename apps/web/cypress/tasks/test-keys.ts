import { database } from './database.ts'
import { readApiEnv } from './api-env.ts'
import { hashKey, randomKey, SUFFIX_LENGTH } from './registration-key.ts'

const SEEDED_ADMIN_EMAIL = 'admin@gameplay.local'
// ISO strings: the columns are timestamp without time zone, stored as UTC by Prisma (a Date object would go in as local time).
const DAY_MS = 24 * 60 * 60 * 1000

/** Hashes of the unused keys created by this run; used keys are found through the user that took them. */
const createdKeyHashes = new Set<string>()

/** Inserts a valid registration key (owned by the seeded admin, only read) and returns it in plain text. */
async function createRegistrationKey(runId: string): Promise<string> {
  const db = database()
  const admin = await db.query<{ id: string }>('select id from "user" where email = $1', [SEEDED_ADMIN_EMAIL])
  const adminId = admin.rows[0]?.id
  if (!adminId) throw new Error(`The seeded admin ${SEEDED_ADMIN_EMAIL} was not found`)

  const key = randomKey()
  const keyHmac = hashKey(key, readApiEnv().registrationKeySecret)
  await db.query(
    `insert into registration_invite (id, "keyHmac", "keySuffix", "expiresAt", "createdById")
     values ($1, $2, $3, $4, $5)`,
    [
      `${runId}_key_${keyHmac.slice(0, 12)}`,
      keyHmac,
      key.slice(-SUFFIX_LENGTH),
      new Date(Date.now() + DAY_MS).toISOString(),
      adminId,
    ],
  )
  createdKeyHashes.add(keyHmac)
  return key
}

export { createdKeyHashes, createRegistrationKey }
