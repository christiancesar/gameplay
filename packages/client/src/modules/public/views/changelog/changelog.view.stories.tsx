import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { languageOptions } from '@/fixtures/language'

import { CHANGELOG_ENTRIES } from '../../model/seeds/changelog-seed'

import { ChangelogView } from './changelog.view'
import { NavigationView } from '../navigation/navigation.view'

const meta = {
  title: 'Public/Changelog',
  component: ChangelogView,
  parameters: { layout: 'fullscreen' },
  args: {
    entries: CHANGELOG_ENTRIES,
    onBack: fn(),
    onSearchChange: fn(),
    onSelectEntry: fn(),
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
      <ChangelogView {...args} />
    </>
  ),
} satisfies Meta<typeof ChangelogView>

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
