import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import type { ChangelogEntry } from '../../model/entities/changelog-entry'

import { languageOptions } from '@/fixtures/language'

import { ChangelogView } from './changelog.view'
import { NavigationView } from '../navigation/navigation.view'

const entries = [
  {
    slug: 'desktop-app-preview',
    date: 'Oct 29, 2026',
    version: '0.0.2',
    title: 'Desktop app gets closer',
    summary: 'The desktop app now has a clearer path for screen and audio sharing.',
    body: 'This release improves the desktop experience for sharing a screen with your group.',
    tags: ['desktop', 'sharing'],
  },
] satisfies ChangelogEntry[]

const meta = {
  title: 'Public/Changelog',
  component: ChangelogView,
  parameters: { layout: 'fullscreen' },
  args: {
    entries,
    hasError: false,
    isLoading: false,
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

export const Loading: Story = { args: { isLoading: true } }

export const Error: Story = { args: { hasError: true } }

export const NotFound: Story = { args: { selectedSlug: 'missing-entry' } }

export const Portuguese: Story = { globals: { locale: 'pt' } }
