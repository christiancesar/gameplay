import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { DOWNLOAD_OPTIONS } from '../model/seeds/download-seed'

import { PublicDownloadView } from './public-download.view'
import { PublicNavigationView } from './public-navigation.view'

const meta = {
  title: 'Public/PublicDownload',
  component: PublicDownloadView,
  parameters: { layout: 'fullscreen' },
  args: {
    isAuthenticated: false,
    options: DOWNLOAD_OPTIONS,
    recommendedPlatform: 'windows',
    onDownload: fn(),
    onNavigate: fn(),
  },
  render: (args) => (
    <>
      <PublicNavigationView isAuthenticated={args.isAuthenticated} onNavigate={args.onNavigate} />
      <PublicDownloadView {...args} />
    </>
  ),
} satisfies Meta<typeof PublicDownloadView>

export default meta
type Story = StoryObj<typeof meta>

export const WindowsRecommended: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const downloadButtons = canvas.getAllByRole('button').filter((button) => button.textContent?.trim() === 'Download')
    await userEvent.click(downloadButtons[0]!)
    await expect(args.onDownload).toHaveBeenCalledWith('windows')
  },
}

export const LinuxRecommended: Story = {
  args: { recommendedPlatform: 'linux' },
}

export const UnknownSystem: Story = {
  args: { recommendedPlatform: null },
}

export const SignedIn: Story = {
  args: { isAuthenticated: true },
}

export const Portuguese: Story = {
  globals: { locale: 'pt' },
}
