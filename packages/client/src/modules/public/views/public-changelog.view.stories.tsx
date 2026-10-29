import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { CHANGELOG_ENTRIES } from '../model/seeds/changelog-seed'

import { PublicChangelogView } from './public-changelog.view'
import { PublicNavigationView } from './public-navigation.view'

const meta = {
  title: 'Public/PublicChangelog',
  component: PublicChangelogView,
  parameters: { layout: 'fullscreen' },
  args: {
    entries: CHANGELOG_ENTRIES,
    onBack: fn(),
    onSearchChange: fn(),
    onSelectEntry: fn(),
  },
  render: (args) => (
    <>
      <PublicNavigationView isAuthenticated={false} onNavigate={() => undefined} />
      <PublicChangelogView {...args} />
    </>
  ),
} satisfies Meta<typeof PublicChangelogView>

export default meta
type Story = StoryObj<typeof meta>

export const List: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /desktop app gets closer/i }))
    await expect(args.onSelectEntry).toHaveBeenCalledWith('desktop-app-preview')
  },
}

export const Empty: Story = { args: { entries: [] } }

export const SelectedEntry: Story = { args: { selectedSlug: 'desktop-app-preview' } }

export const Portuguese: Story = { globals: { locale: 'pt' } }
