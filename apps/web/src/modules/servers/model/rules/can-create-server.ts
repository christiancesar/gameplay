import type { MyLimits } from '@gameplay/contracts'

/** Whether the Hub should offer "create server". Stays open until the limits load; the API still enforces them. */
function canCreateServer(limits: MyLimits | undefined): boolean {
  if (!limits) return true
  return limits.ownedServers < limits.maxServers
}

export { canCreateServer }
