import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/admin')({
  beforeLoad: async ({ context, location }) => {
    const session = context.session
    if (!session?.user) {
      throw redirect({ to: '/', replace: true })
    }
    const user = session.user as { role?: string; twoFactorEnabled?: boolean }
    if (user.role !== 'admin') {
      throw redirect({ to: '/', replace: true })
    }
    if (location.pathname === '/admin' || location.pathname === '/_authed/admin') {
      throw redirect({ to: '/admin/users', replace: true })
    }
    if (!user.twoFactorEnabled && location.pathname !== '/admin/setup') {
      throw redirect({ to: '/admin/setup', replace: true })
    }
    if (user.twoFactorEnabled && location.pathname === '/admin/setup') {
      throw redirect({ to: '/admin/users', replace: true })
    }
    return {}
  },
})
