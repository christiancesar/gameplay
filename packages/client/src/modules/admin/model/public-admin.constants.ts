const PUBLIC_ADMIN_TABS = ['roadmap', 'changelog', 'feature-requests'] as const
type PublicAdminTab = (typeof PUBLIC_ADMIN_TABS)[number]

export { PUBLIC_ADMIN_TABS }
export type { PublicAdminTab }
