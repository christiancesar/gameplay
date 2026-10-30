import { ROADMAP_ITEMS } from '../model/seeds/roadmap-seed'

function usePublicRoadmapViewModel() {
  return { items: ROADMAP_ITEMS }
}

export { usePublicRoadmapViewModel }
