export type HubNotification = { id: string; createdAt?: string } & (
  | { type: 'browserUnsupported'; browser: { name: string; version: string } }
  | { type: 'browserOutdated'; browser: { name: string; version: string }; minVersion: number }
  | { type: 'vpn' }
  | { type: 'accelerationOff' }
  | { type: 'monitorsPermission' }
  | { type: 'joinApproved'; server: { id: string; name: string } }
  | { type: 'requestSent'; server: { name: string } }
  | { type: 'kicked'; server: { name: string } }
  | { type: 'serverDeleted'; server: { name: string } }
  | { type: 'promoted'; server: { name: string } }
  | { type: 'demoted'; server: { name: string } }
  /** O convite expirou enquanto a pessoa se cadastrava: precisa de um novo. */
  | { type: 'inviteExpired'; server: { name: string } }
)
