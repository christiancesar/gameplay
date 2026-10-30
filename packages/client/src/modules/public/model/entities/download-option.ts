type DownloadPlatform = 'windows' | 'linux'
type DownloadFormat = 'squirrel-installer' | 'deb' | 'appimage'

type DownloadArtifact = {
  format: DownloadFormat
  url?: string
  size?: number
  sha256?: string
}

type DownloadOption = {
  platform: DownloadPlatform
  version: string
  architecture: string
  available: boolean
  artifacts: DownloadArtifact[]
}

export type { DownloadArtifact, DownloadFormat, DownloadOption, DownloadPlatform }
