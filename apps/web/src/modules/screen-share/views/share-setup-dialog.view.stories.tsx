import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen } from 'storybook/test'

import { ShareSetupDialogView, type AudioSupport, type ShareSettings } from './share-setup-dialog.view'

// Regra de exemplo só para a story; a real fica no Model e considera o sistema operacional.
const audioSupportFor = (settings: ShareSettings): AudioSupport =>
  settings.source === 'tab' ? 'supported' : settings.source === 'screen' ? 'windowsOnly' : 'unsupported'

const meta = {
  title: 'ScreenShare/ShareSetupDialog',
  component: ShareSetupDialogView,
  args: {
    open: true,
    settings: { source: 'window', resolution: '1080p', fps: 60, includeAudio: true },
    audioSupport: 'unsupported',
    saveAsDefault: true,
    onOpenChange: fn(),
    onChange: fn(),
    onSaveAsDefaultChange: fn(),
    onStart: fn(),
  },
  render: function Render(args) {
    const [settings, setSettings] = useState(args.settings)
    return (
      <ShareSetupDialogView
        {...args}
        settings={settings}
        audioSupport={audioSupportFor(settings)}
        onChange={(next) => {
          args.onChange(next)
          setSettings(next)
        }}
      />
    )
  },
} satisfies Meta<typeof ShareSetupDialogView>

export default meta
type Story = StoryObj<typeof meta>

/** Padrão salvo do usuário: janela/jogo em 1080p60. */
export const WindowOrGame: Story = {}

export const EntireScreen: Story = { args: { settings: { source: 'screen', resolution: '1080p', fps: 60, includeAudio: true } } }

export const BrowserTab: Story = { args: { settings: { source: 'tab', resolution: '720p', fps: 30, includeAudio: true } } }

export const ChooseAndStart: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.click(screen.getByRole('radio', { name: /browser tab/i }))
    await userEvent.click(screen.getByRole('radio', { name: '720p' }))
    await userEvent.click(screen.getByRole('radio', { name: '30 fps' }))
    await expect(args.onChange).toHaveBeenLastCalledWith({ source: 'tab', resolution: '720p', fps: 30, includeAudio: true })
    await expect(screen.getByRole('switch', { name: /share audio/i })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: /choose and share/i }))
    await expect(args.onStart).toHaveBeenCalledOnce()
  },
}

export const WindowAudioUnavailable: Story = {
  play: async () => {
    await expect(screen.getByRole('switch', { name: /share audio/i })).toBeDisabled()
  },
}
