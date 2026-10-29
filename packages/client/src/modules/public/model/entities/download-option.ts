type DownloadPlatform = 'windows' | 'linux'

type DownloadOption = {
  platform: DownloadPlatform
  version: string
  architecture: string
  available: boolean
}

export type { DownloadOption, DownloadPlatform }
