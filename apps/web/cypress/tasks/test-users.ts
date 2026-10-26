import { randomBytes } from 'node:crypto'

import { postAuth } from './auth-api.ts'
import { database } from './database.ts'
import { createRegistrationKey } from './test-keys.ts'

const PASSWORD = 'e2e-pass-123'

type CreateUserInput = { tag: string; role?: 'admin'; maxServersOverride?: number }
type TestUser = { id: string; username: string; email: string; password: string }
type TestAdmin = TestUser & { secret: string; recoveryCodes: string[] }

/** Creates the user through the real sign-up API with a fresh registration key. */
async function createUser(runId: string, { tag, role, maxServersOverride }: CreateUserInput): Promise<TestUser> {
  const username = `${runId}-${tag}-${randomBytes(2).toString('hex')}`
  const email = `${username}@e2e.test`
  const registrationKey = await createRegistrationKey(runId)
  const response = await postAuth('/sign-up/email', {
    username,
    email,
    password: PASSWORD,
    name: username,
    registrationKey,
  })
  if (response.status !== 200) throw new Error(`Sign-up of ${username} failed with ${response.status}`)

  const id = (response.body.user as { id: string }).id
  if (role) await database().query('update "user" set role = $2 where id = $1', [id, role])
  if (maxServersOverride !== undefined) {
    await database().query('update "user" set "maxServersOverride" = $2 where id = $1', [id, maxServersOverride])
  }
  return { id, username, email, password: PASSWORD }
}

/** Reads the user back from the database. */
async function getUser(username: string) {
  const { rows } = await database().query(
    `select id, username, "displayUsername", theme, locale, "maxServersOverride", "twoFactorEnabled"
     from "user" where username = $1`,
    [username],
  )
  return rows[0] ?? null
}

export { createUser, getUser, PASSWORD }
export type { CreateUserInput, TestAdmin, TestUser }
