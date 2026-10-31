import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { PublicFeatureRequestsTabView } from './public-feature-requests-tab.view'

const request = {
  id: 'request-1',
  title: 'Mobile companion',
  description: 'A lightweight companion for mobile.',
  status: 'pending' as const,
  roadmapItemId: null,
  createdAt: '2026-10-30T12:00:00.000Z',
  updatedAt: '2026-10-30T12:00:00.000Z',
  author: { id: 'user-1', username: 'ana' },
}
const roadmap = [
  {
    id: 'roadmap-1',
    slug: 'screen-sharing',
    title: 'Screen sharing',
    description: 'Share a window.',
    status: 'now' as const,
    position: 0,
    visibility: 'published' as const,
    voteCount: 2,
    votedByMe: false,
    createdAt: '2026-10-30T12:00:00.000Z',
    updatedAt: '2026-10-30T12:00:00.000Z',
  },
]

const meta = {
  title: 'Admin/Public/Feature requests',
  component: PublicFeatureRequestsTabView,
  args: { requests: [request], roadmapItems: roadmap, isSaving: false, onModerate: fn() },
} satisfies Meta<typeof PublicFeatureRequestsTabView>

export default meta
type Story = StoryObj<typeof meta>

export const List: Story = {}
export const Empty: Story = { args: { requests: [] } }
export const Portuguese: Story = { globals: { locale: 'pt' } }
