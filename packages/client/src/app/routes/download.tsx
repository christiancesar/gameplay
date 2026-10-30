import { createFileRoute } from '@tanstack/react-router'

import { PublicDownloadScreen } from '@/modules/public/screens/public-download.screen'

export const Route = createFileRoute('/download')({
  component: PublicDownloadScreen,
})
