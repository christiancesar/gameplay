import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/admin')({
  beforeLoad: ({ context, location }) => {
    const { user } = context.session
    if (user.role !== 'admin') {
      throw redirect({ to: '/', replace: true })
    }
    const onSetup = location.pathname === '/admin/setup'
    if (!user.twoFactorEnabled && !onSetup) {
      throw redirect({ to: '/admin/setup', replace: true })
    }
    if (user.twoFactorEnabled && onSetup) {
      throw redirect({ to: '/admin/users', replace: true })
    }
  },
})
