import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor } from 'storybook/test'

import {
  ShareSetupDialogView,
  type AudioSupport,
  type SharePriority,
  type ShareSettings,
} from './share-setup-dialog.view'

// Regra de exemplo só para a story (Chrome 141 no Windows); a real fica no Model e considera browser e sistema.
const audioSupportFor = (settings: ShareSettings, base: AudioSupport): AudioSupport => {
  if (base === 'browserUnsupported') return base
  return settings.source === 'window' ? 'windowMaybe' : 'supported'
}

const meta = {
  title: 'ScreenShare/ShareSetupDialog',
  component: ShareSetupDialogView,
  args: {
    open: true,
    settings: { source: 'window', resolution: '1080p', fps: 60, includeAudio: true },
    priority: 'smooth',
    audioSupport: 'windowMaybe',
    saveAsDefault: true,
    onOpenChange: fn(),
    onChange: fn(),
    onPriorityChange: fn(),
    onSaveAsDefaultChange: fn(),
    onStart: fn(),
  },
  render: function Render(args) {
    const [settings, setSettings] = useState(args.settings)
    const [priority, setPriority] = useState<SharePriority>(args.priority)
    return (
      <ShareSetupDialogView
        {...args}
        settings={settings}
        priority={priority}
        onPriorityChange={(next) => {
          args.onPriorityChange(next)
          setPriority(next)
        }}
        audioSupport={audioSupportFor(settings, args.audioSupport)}
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

export const EntireScreen: Story = {
  args: { settings: { source: 'screen', resolution: '1080p', fps: 60, includeAudio: true } },
}

export const BrowserTab: Story = {
  args: { settings: { source: 'tab', resolution: '720p', fps: 30, includeAudio: true } },
}

export const ChooseAndStart: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.click(screen.getByRole('radio', { name: /browser tab/i }))
    await userEvent.click(screen.getByRole('radio', { name: '720p' }))
    await userEvent.click(screen.getByRole('radio', { name: '30 fps' }))
    await expect(args.onChange).toHaveBeenLastCalledWith({
      source: 'tab',
      resolution: '720p',
      fps: 30,
      includeAudio: true,
    })
    await expect(screen.getByRole('switch', { name: /share audio/i })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: /choose and share/i }))
    await expect(args.onStart).toHaveBeenCalledOnce()
  },
}

export const SharpPriority: Story = {
  args: { priority: 'sharp' },
  play: async ({ args, userEvent }) => {
    await expect(screen.getByRole('radio', { name: /sharp/i })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: /smooth/i }))
    await expect(args.onPriorityChange).toHaveBeenLastCalledWith('smooth')
    await expect(screen.getByRole('radio', { name: /smooth/i })).toBeChecked()
  },
}

export const WindowAudioMaybe: Story = {
  play: async () => {
    await expect(screen.getByRole('switch', { name: /share audio/i })).toBeEnabled()
    await waitFor(() => expect(screen.getByText(/may offer the window's own audio/i)).toBeVisible())
  },
}

/** Firefox e Safari não capturam áudio de tela: o aviso fica em âmbar, o switch continua ligado. */
export const BrowserWithoutAudio: Story = {
  args: { audioSupport: 'browserUnsupported' },
  play: async () => {
    await expect(screen.getByRole('switch', { name: /share audio/i })).toBeEnabled()
    await expect(screen.getByText(/use chrome or edge/i)).toHaveClass('text-amber-500')
  },
}

/** Durante a transmissão: resolução, FPS e prioridade mudam, na hora. */
export const ChangeQualityLive: Story = {
  args: { mode: 'update' },
  play: async ({ args, userEvent }) => {
    await waitFor(() => expect(screen.getByRole('dialog', { name: /change quality/i })).toBeVisible())
    await expect(screen.queryByRole('radio', { name: /browser tab/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: '720p' }))
    await userEvent.click(screen.getByRole('radio', { name: /sharp/i }))
    await expect(args.onPriorityChange).toHaveBeenLastCalledWith('sharp')
    await userEvent.click(screen.getByRole('button', { name: /apply/i }))
    await expect(args.onStart).toHaveBeenCalledOnce()
  },
}
