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
    await userEvent.click(canvas.getByRole('button', { name: 'Download Windows installer' }))
    await expect(args.onDownload).toHaveBeenCalledWith('windows', 'squirrel-installer', undefined)
  },
}

export const LinuxRecommended: Story = {
  args: { recommendedPlatform: 'linux' },
}

export const LinuxInstallInstructions: Story = {
  args: { recommendedPlatform: 'linux' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open DEB package installation instructions' }))
    await expect(document.body).toHaveTextContent('sudo apt install ./gameplay.deb')
  },
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
