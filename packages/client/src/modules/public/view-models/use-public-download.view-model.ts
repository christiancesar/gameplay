import { DOWNLOAD_OPTIONS } from '../model/seeds/download-seed'

function usePublicDownloadViewModel() {
  return { options: DOWNLOAD_OPTIONS, recommendedPlatform: 'windows' as const }
}

export { usePublicDownloadViewModel }
