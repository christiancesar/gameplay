import type { Meta, StoryObj } from '@storybook/react-vite'

import { ROADMAP_ITEMS } from '../model/seeds/roadmap-seed'

import { PublicNavigationView } from './public-navigation.view'
import { PublicRoadmapView } from './public-roadmap.view'

const meta = {
  title: 'Public/PublicRoadmap',
  component: PublicRoadmapView,
  parameters: { layout: 'fullscreen' },
  args: { items: ROADMAP_ITEMS },
  render: (args) => (
    <>
      <PublicNavigationView isAuthenticated={false} onNavigate={() => undefined} />
      <PublicRoadmapView {...args} />
    </>
  ),
} satisfies Meta<typeof PublicRoadmapView>

export default meta
type Story = StoryObj<typeof meta>

export const Full: Story = {}

export const Empty: Story = { args: { items: [] } }

export const Portuguese: Story = { globals: { locale: 'pt' } }
