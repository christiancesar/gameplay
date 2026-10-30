import { http } from '@/shared/lib/http'

import { downloadManifestSchema } from '../download-manifest.schema'
import type { DownloadManifest } from '../download-manifest.schema'

async function getLatestDownloadManifest(): Promise<DownloadManifest> {
  const response = await http.get<unknown>('/downloads/latest')
  return downloadManifestSchema.parse(response.data)
}

export { getLatestDownloadManifest }
