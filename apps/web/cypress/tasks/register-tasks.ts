import { cleanup, countLeft } from './cleanup.ts'
import { closeDatabase } from './database.ts'
import { createAdminWithTwoFactor } from './test-admin.ts'
import { createRegistrationKey } from './test-keys.ts'
import { createBotTasks, stopBot } from './peer-bot.ts'
import { addMember, createRoom, createServer, createServerInvite, getMembers } from './test-servers.ts'
import { createUser, getUser } from './test-users.ts'
import { generateTotp, msUntilNextWindow } from './totp.ts'

/** The `cy.task` names. Every task returns something serializable (never undefined). */
function createTasks(runId: string) {
  return {
    'run:id': () => runId,
    'db:createRegistrationKey': () => createRegistrationKey(runId),
    'db:createUser': (input: Parameters<typeof createUser>[1]) => createUser(runId, input),
    'db:createAdminWithTwoFactor': (tag: string) => createAdminWithTwoFactor(runId, tag),
    'db:createServer': (input: Parameters<typeof createServer>[1]) => createServer(runId, input),
    'db:addMember': addMember,
    'db:createRoom': (input: Parameters<typeof createRoom>[1]) => createRoom(runId, input),
    'db:createServerInvite': (input: Parameters<typeof createServerInvite>[1]) => createServerInvite(runId, input),
    'db:getUser': (username: string) => getUser(username),
    'db:getMembers': (serverId: string) => getMembers(serverId),
    'db:cleanup': () => cleanup(runId),
    'db:countLeft': () => countLeft(runId),
    ...createBotTasks(),
    'auth:totp': (secret: string) => generateTotp(secret),
    /** Wait for a fresh 30 s window when a code was just used, so a verification never reuses it. */
    'auth:freshTotp': async (secret: string) => {
      if (msUntilNextWindow() < 28_000) await new Promise((resolve) => setTimeout(resolve, msUntilNextWindow() + 200))
      return generateTotp(secret)
    },
  }
}

async function afterRun(runId: string) {
  try {
    await stopBot()
    await cleanup(runId)
  } finally {
    await closeDatabase()
  }
}

export { afterRun, createTasks }
