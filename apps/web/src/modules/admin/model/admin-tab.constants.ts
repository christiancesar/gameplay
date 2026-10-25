const ADMIN_TABS = ['users', 'servers', 'hardware', 'limits', 'keys'] as const
type AdminTab = (typeof ADMIN_TABS)[number]

export { ADMIN_TABS }
export type { AdminTab }
