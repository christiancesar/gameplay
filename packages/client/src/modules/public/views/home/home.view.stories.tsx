import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { languageOptions } from '@/fixtures/language'

import { NavigationView } from '../navigation/navigation.view'
import { HomeView } from './home.view'

const meta = {
  title: 'Public/Home',
  component: HomeView,
  parameters: { layout: 'fullscreen' },
  args: {
    isAuthenticated: false,
    onNavigate: fn(),
  },
  render: (args) => (
    <>
      <NavigationView
        isAuthenticated={args.isAuthenticated}
        onNavigate={args.onNavigate}
        theme="light"
        language="en"
        languageOptions={languageOptions}
        onToggleTheme={() => undefined}
        onLanguageChange={() => undefined}
      />
      <HomeView {...args} />
    </>
  ),
} satisfies Meta<typeof HomeView>

export default meta
type Story = StoryObj<typeof meta>

export const SignedOut: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const getStartedButtons = canvas.getAllByRole('button', { name: /get started/i })
    await userEvent.click(getStartedButtons[getStartedButtons.length - 1]!)
    await expect(args.onNavigate).toHaveBeenCalledWith('sign-in')
  },
}

export const SignedIn: Story = {
  args: { isAuthenticated: true },
  play: async ({ args, canvas, userEvent }) => {
    const openHubButtons = canvas.getAllByRole('button', { name: /open hub/i })
    await userEvent.click(openHubButtons[openHubButtons.length - 1]!)
    await expect(args.onNavigate).toHaveBeenCalledWith('hub')
  },
}

export const Portuguese: Story = {
  globals: { locale: 'pt' },
}
