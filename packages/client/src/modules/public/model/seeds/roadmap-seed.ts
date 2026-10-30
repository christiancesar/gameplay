import type { RoadmapItem } from '../entities/roadmap-item'

const ROADMAP_ITEMS: RoadmapItem[] = [
  { id: 'desktop-app', status: 'now', titleKey: 'desktopApp', descriptionKey: 'desktopAppDescription' },
  { id: 'screen-sharing', status: 'now', titleKey: 'screenSharing', descriptionKey: 'screenSharingDescription' },
  { id: 'windows-audio', status: 'next', titleKey: 'windowsAudio', descriptionKey: 'windowsAudioDescription' },
  { id: 'roadmap-voting', status: 'next', titleKey: 'roadmapVoting', descriptionKey: 'roadmapVotingDescription' },
  {
    id: 'feature-requests',
    status: 'exploring',
    titleKey: 'featureRequests',
    descriptionKey: 'featureRequestsDescription',
  },
  {
    id: 'mobile-companion',
    status: 'exploring',
    titleKey: 'mobileCompanion',
    descriptionKey: 'mobileCompanionDescription',
  },
  { id: 'voice-rooms', status: 'done', titleKey: 'voiceRooms', descriptionKey: 'voiceRoomsDescription' },
  { id: 'sfu-streaming', status: 'done', titleKey: 'sfuStreaming', descriptionKey: 'sfuStreamingDescription' },
]

export { ROADMAP_ITEMS }
