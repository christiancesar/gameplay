import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { languageOptions } from '@/fixtures/language'

import { DOWNLOAD_OPTIONS } from '../../model/seeds/download-seed'

import { DownloadView } from './download.view'
import { NavigationView } from '../navigation/navigation.view'

const meta = {
  title: 'Public/Download',
  component: DownloadView,
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
      <NavigationView
        isAuthenticated={args.isAuthenticated}
        onNavigate={args.onNavigate}
        theme="light"
        language="en"
        languageOptions={languageOptions}
        onToggleTheme={() => undefined}
        onLanguageChange={() => undefined}
      />
      <DownloadView {...args} />
    </>
  ),
} satisfies Meta<typeof DownloadView>

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
