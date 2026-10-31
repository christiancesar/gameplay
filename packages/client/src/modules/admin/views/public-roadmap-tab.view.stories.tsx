import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { PublicRoadmapTabView } from './public-roadmap-tab.view'

const item = {
  id: 'roadmap-1',
  slug: 'screen-sharing',
  title: 'Screen sharing',
  description: 'Share a window with the room.',
  status: 'now' as const,
  position: 0,
  visibility: 'published' as const,
  voteCount: 12,
  votedByMe: false,
  createdAt: '2026-10-30T12:00:00.000Z',
  updatedAt: '2026-10-30T12:00:00.000Z',
}

const meta = {
  title: 'Admin/Public/Roadmap',
  component: PublicRoadmapTabView,
  args: {
    items: [item],
    editing: null,
    isSaving: false,
    onEdit: fn(),
    onCancel: fn(),
    onArchive: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof PublicRoadmapTabView>

export default meta
type Story = StoryObj<typeof meta>

export const List: Story = {}
export const Empty: Story = { args: { items: [] } }
export const Editing: Story = { args: { editing: item } }
export const Portuguese: Story = { globals: { locale: 'pt' } }
