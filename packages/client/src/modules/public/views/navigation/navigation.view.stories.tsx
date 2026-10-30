import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { languageOptions } from '@/fixtures/language'

import { NavigationView, type PublicDestination } from './navigation.view'

const meta = {
  title: 'Public/Navigation',
  component: NavigationView,
  parameters: { layout: 'fullscreen' },
  args: {
    isAuthenticated: false,
    onNavigate: fn(),
    theme: 'light',
    language: 'en',
    languageOptions,
    onToggleTheme: fn(),
    onLanguageChange: fn(),
  },
} satisfies Meta<typeof NavigationView>

export default meta
type Story = StoryObj<typeof meta>

export const SignedOut: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^sign in$/i }))
    await expect(args.onNavigate).toHaveBeenCalledWith('sign-in' satisfies PublicDestination)
  },
}

export const SignedIn: Story = {
  args: { isAuthenticated: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /open hub/i }))
    await expect(args.onNavigate).toHaveBeenCalledWith('hub' satisfies PublicDestination)
  },
}

export const Portuguese: Story = {
  globals: { locale: 'pt' },
}
