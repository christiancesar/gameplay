import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { RoadmapItem } from '@gameplay/contracts'

import { languageOptions } from '@/fixtures/language'

import { NavigationView } from '../navigation/navigation.view'
import { RoadmapView } from './roadmap.view'

const items = [
  {
    id: 'roadmap-1',
    slug: 'community-voting',
    title: 'Community voting',
    description: 'Let the community help decide what deserves attention next.',
    status: 'next',
    position: 0,
    visibility: 'published',
    voteCount: 12,
    votedByMe: false,
    createdAt: '2026-10-30T00:00:00.000Z',
    updatedAt: '2026-10-30T00:00:00.000Z',
  },
] satisfies RoadmapItem[]

const meta = {
  title: 'Public/Roadmap',
  component: RoadmapView,
  parameters: { layout: 'fullscreen' },
  args: {
    items,
    hasError: false,
    isAuthenticated: false,
    isLoading: false,
    isSubmittingRequest: false,
    isVoting: false,
    onRequireAuth: fn(),
    onRequestDialogOpen: fn(),
    onSubmitRequest: fn(),
    onVote: fn(),
    requestSent: false,
  },
  render: (args) => (
    <>
      <NavigationView
        isAuthenticated={false}
        onNavigate={() => undefined}
        theme="light"
        language="en"
        languageOptions={languageOptions}
        onToggleTheme={() => undefined}
        onLanguageChange={() => undefined}
      />
      <RoadmapView {...args} />
    </>
  ),
} satisfies Meta<typeof RoadmapView>

export default meta
type Story = StoryObj<typeof meta>

export const Full: Story = {}

export const Empty: Story = { args: { items: [] } }

export const Authenticated: Story = { args: { isAuthenticated: true } }

export const Loading: Story = { args: { isLoading: true } }

export const Error: Story = { args: { hasError: true } }

export const Portuguese: Story = { globals: { locale: 'pt' } }
