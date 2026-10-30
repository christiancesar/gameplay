import { createFileRoute } from '@tanstack/react-router'

import { HomeScreen } from '@/modules/public/screens/home/home.screen'

export const Route = createFileRoute('/')({
  component: HomeScreen,
})
