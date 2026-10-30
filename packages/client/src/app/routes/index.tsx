import { createFileRoute } from '@tanstack/react-router'

import { PublicHomeScreen } from '@/modules/public/screens/public-home.screen'

export const Route = createFileRoute('/')({
  component: PublicHomeScreen,
})
