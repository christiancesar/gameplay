import { useQuery } from '@tanstack/react-query'

import type { DownloadArtifact, DownloadOption, DownloadPlatform } from '../model/entities/download-option'
import { downloadsKeys } from '../model/services/downloads.keys'
import { getLatestDownloadManifest } from '../model/services/downloads.service'
import { DOWNLOAD_OPTIONS } from '../model/seeds/download-seed'

function platformFromUserAgent(): DownloadPlatform | null {
  if (typeof navigator === 'undefined') return null
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('windows')) return 'windows'
  if (userAgent.includes('linux')) return 'linux'
  return null
}

function artifactFromManifest(artifact: {
  format: DownloadArtifact['format']
  url: string
  size: number
  sha256: string
}): DownloadArtifact {
  return { format: artifact.format, url: artifact.url, size: artifact.size, sha256: artifact.sha256 }
}

function optionsFromManifest(manifest: Awaited<ReturnType<typeof getLatestDownloadManifest>>): DownloadOption[] {
  return [
    {
      platform: 'windows',
      version: manifest.version,
      architecture: manifest.downloads.windows.architecture,
      available: true,
      artifacts: [artifactFromManifest(manifest.downloads.windows)],
    },
    {
      platform: 'linux',
      version: manifest.version,
      architecture: manifest.downloads.linuxDeb.architecture,
      available: true,
      artifacts: [
        artifactFromManifest(manifest.downloads.linuxDeb),
        artifactFromManifest(manifest.downloads.linuxAppImage),
      ],
    },
  ]
}

function usePublicDownloadViewModel() {
  const query = useQuery({
    queryKey: downloadsKeys.latest(),
    queryFn: getLatestDownloadManifest,
  })

  return {
    options: query.data ? optionsFromManifest(query.data) : DOWNLOAD_OPTIONS,
    recommendedPlatform: platformFromUserAgent(),
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

export { usePublicDownloadViewModel }
