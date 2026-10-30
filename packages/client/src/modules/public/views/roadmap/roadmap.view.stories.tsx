import type { Meta, StoryObj } from '@storybook/react-vite'

import { languageOptions } from '@/fixtures/language'

import { ROADMAP_ITEMS } from '../../model/seeds/roadmap-seed'

import { NavigationView } from '../navigation/navigation.view'
import { RoadmapView } from './roadmap.view'

const meta = {
  title: 'Public/Roadmap',
  component: RoadmapView,
  parameters: { layout: 'fullscreen' },
  args: { items: ROADMAP_ITEMS },
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

export const Portuguese: Story = { globals: { locale: 'pt' } }
