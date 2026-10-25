import { createFileRoute } from '@tanstack/react-router'

import { PendingScreen } from '@/app/pending.screen'

export const Route = createFileRoute('/_authed/')({
  component: PendingScreen,
})
