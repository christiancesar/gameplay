import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { PublicNavigationView } from './public-navigation.view'
import { PublicHomeView } from './public-home.view'

const meta = {
  title: 'Public/PublicHome',
  component: PublicHomeView,
  parameters: { layout: 'fullscreen' },
  args: {
    isAuthenticated: false,
    onNavigate: fn(),
  },
  render: (args) => (
    <>
      <PublicNavigationView isAuthenticated={args.isAuthenticated} onNavigate={args.onNavigate} />
      <PublicHomeView {...args} />
    </>
  ),
} satisfies Meta<typeof PublicHomeView>

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
