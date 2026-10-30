import { createFileRoute } from '@tanstack/react-router'

import { DownloadScreen } from '@/modules/public/screens/download/download.screen'

export const Route = createFileRoute('/download')({
  component: DownloadScreen,
})
