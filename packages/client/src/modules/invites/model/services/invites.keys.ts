/** Query keys of the invites module. */
const invitesKeys = {
  all: ['invites'] as const,
  resolve: (code: string) => [...invitesKeys.all, 'resolve', code] as const,
}

export { invitesKeys }
