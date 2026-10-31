import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/admin/_panel/public/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/public/roadmap', replace: true })
  },
})
