import type { DownloadOption } from '../entities/download-option'

const DOWNLOAD_OPTIONS: DownloadOption[] = [
  { platform: 'windows', version: '0.0.2', architecture: 'x64', available: true },
  { platform: 'linux', version: '0.0.2', architecture: 'x64', available: true },
]

export { DOWNLOAD_OPTIONS }
