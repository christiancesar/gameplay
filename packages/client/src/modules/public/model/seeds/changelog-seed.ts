import type { ChangelogEntry } from '../entities/changelog-entry'

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    slug: 'desktop-app-preview',
    date: '2026-10-29',
    version: '0.0.2',
    title: 'Desktop app gets closer',
    summary: 'The desktop app now has a clearer path for screen and audio sharing.',
    body: 'This release improves the desktop experience for sharing a screen with your group.',
    tags: ['desktop', 'sharing'],
  },
  {
    slug: 'screen-share-profiles',
    date: '2026-10-28',
    version: '0.0.1',
    title: 'Screen sharing profiles',
    summary: 'Choose the right profile for each screen share.',
    body: 'Screen sharing profiles make quality choices easier for every room.',
    tags: ['sharing', 'quality'],
  },
  {
    slug: 'sfu-streaming',
    date: '2026-10-27',
    version: '0.0.0',
    title: 'Reliable live streaming',
    summary: 'A stronger path for sharing a screen with the whole room.',
    body: 'The streaming path is more reliable for larger screen shares.',
    tags: ['streaming', 'rooms'],
  },
]

export { CHANGELOG_ENTRIES }
