import type { ChangelogEntry } from '../entities/changelog-entry'

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    slug: 'desktop-app-preview',
    date: '2026-10-29',
    version: '0.0.2',
    titleKey: 'desktopAppPreview',
    summaryKey: 'desktopAppPreviewSummary',
    bodyKey: 'desktopAppPreviewBody',
    tagKeys: ['desktop', 'sharing'],
  },
  {
    slug: 'screen-share-profiles',
    date: '2026-10-28',
    version: '0.0.1',
    titleKey: 'screenShareProfiles',
    summaryKey: 'screenShareProfilesSummary',
    bodyKey: 'screenShareProfilesBody',
    tagKeys: ['sharing', 'quality'],
  },
  {
    slug: 'sfu-streaming',
    date: '2026-10-27',
    version: '0.0.0',
    titleKey: 'sfuStreaming',
    summaryKey: 'sfuStreamingSummary',
    bodyKey: 'sfuStreamingBody',
    tagKeys: ['streaming', 'rooms'],
  },
]

export { CHANGELOG_ENTRIES }
