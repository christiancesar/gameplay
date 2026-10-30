type RoadmapStatus = 'now' | 'next' | 'exploring' | 'done'

type RoadmapItem = {
  id: string
  status: RoadmapStatus
  titleKey: string
  descriptionKey: string
}

export type { RoadmapItem, RoadmapStatus }
