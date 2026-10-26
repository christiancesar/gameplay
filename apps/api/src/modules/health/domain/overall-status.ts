import type { ComponentReport, ComponentStatus } from '../../../common/health/probe'

type Components = { database: ComponentReport; storage: ComponentReport; turn?: ComponentReport }

// Without the database or the storage the app is down. Without TURN, calls
// still work for people with a reachable NAT, so the app is only degraded.
export function overallStatus({ database, storage, turn }: Components): ComponentStatus {
  if (database.status === 'outage' || storage.status === 'outage') return 'outage'
  const all = turn ? [database, storage, turn] : [database, storage]
  return all.every((component) => component.status === 'operational') ? 'operational' : 'degraded'
}
