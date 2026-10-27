export type HubNotification = { id: string; createdAt?: string } & (
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
  /** Escrito pelo admin da plataforma: o texto vem pronto, sem i18n. */
  | { type: 'platformAnnouncement'; announcement: { title: string; message: string } }
)
