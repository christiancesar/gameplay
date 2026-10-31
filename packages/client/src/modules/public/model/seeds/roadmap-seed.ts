import type { RoadmapItem } from '../entities/roadmap-item'

const ROADMAP_ITEMS: RoadmapItem[] = [
  ...([
    ['desktop-app', 'now', 'Desktop app', 'Bring screen and audio sharing closer to the games you play.'],
    ['screen-sharing', 'now', 'Screen sharing profiles', 'Choose the right resolution, aspect ratio and frame rate.'],
    ['windows-audio', 'next', 'Windows app audio', 'Share the sound of a game or app without the voice room.'],
  ].map(([id, status, title, description], position) => ({
    id,
    slug: id,
    title,
    description,
    status,
    position,
    visibility: 'published',
    voteCount: 0,
    votedByMe: false,
    createdAt: '2026-10-30T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
  })) as RoadmapItem[]),
]

export { ROADMAP_ITEMS }
