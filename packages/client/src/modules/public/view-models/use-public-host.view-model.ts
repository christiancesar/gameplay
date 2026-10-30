import { usePlatform } from '@/shared/platform/use-platform'

function usePublicHostViewModel() {
  return { isDesktop: usePlatform().kind === 'desktop' }
}

export { usePublicHostViewModel }
