import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/admin/_panel/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/users', replace: true })
  },
})
