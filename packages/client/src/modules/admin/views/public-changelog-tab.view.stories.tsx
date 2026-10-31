import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { PublicChangelogTabView } from './public-changelog-tab.view'

const entry = {
  id: 'entry-1',
  slug: 'desktop-preview',
  version: '0.1.0',
  title: 'Desktop preview',
  summary: 'A first desktop preview.',
  body: 'The desktop preview is ready.',
  tags: ['desktop'],
  visibility: 'published' as const,
  publishedAt: '2026-10-30T12:00:00.000Z',
  createdAt: '2026-10-30T12:00:00.000Z',
  updatedAt: '2026-10-30T12:00:00.000Z',
}

const meta = {
  title: 'Admin/Public/Changelog',
  component: PublicChangelogTabView,
  args: { entries: [entry], editing: null, isSaving: false, onEdit: fn(), onCancel: fn(), onSubmit: fn() },
} satisfies Meta<typeof PublicChangelogTabView>

export default meta
type Story = StoryObj<typeof meta>

export const List: Story = {}
export const Empty: Story = { args: { entries: [] } }
export const Editing: Story = { args: { editing: entry } }
export const Portuguese: Story = { globals: { locale: 'pt' } }
