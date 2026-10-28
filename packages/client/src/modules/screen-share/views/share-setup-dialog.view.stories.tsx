import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { captureSources } from '@/fixtures/capture-sources'

import {
  ShareSetupDialogView,
  type AudioSupport,
  type SharePriority,
  type ShareSettings,
  type StreamModeChoice,
  type StreamModeOptions,
} from './share-setup-dialog.view'

// Regra de exemplo só para a story (Chrome no Windows, ou no Linux com `tabOnly`); a real fica no Model e considera browser e sistema.
const audioSupportFor = (settings: ShareSettings, base: AudioSupport): AudioSupport => {
  if (base === 'browserUnsupported' || base === 'apps' || base === 'systemWithoutApp') return base
  if (settings.source === 'tab') return 'supported'
  if (settings.source === 'window') return 'windowUnsupported'
  return base === 'tabOnly' ? 'tabOnly' : 'supported'
}

const meta = {
  title: 'ScreenShare/ShareSetupDialog',
  component: ShareSetupDialogView,
  args: {
    open: true,
    settings: { source: 'window', resolution: '1080p', fps: 60, includeAudio: true, audioApps: [] },
    priority: 'smooth',
    audioSupport: 'windowUnsupported',
    saveAsDefault: true,
    onOpenChange: fn(),
    onChange: fn(),
    onPriorityChange: fn(),
    onSaveAsDefaultChange: fn(),
    streamMode: 'sfu',
    streamModes: {
      sfu: { available: true, reason: null },
      mesh: { available: true },
    } satisfies StreamModeOptions as StreamModeOptions,
    onStreamModeChange: fn(),
    onStart: fn(),
  },
  render: function Render(args) {
    const [settings, setSettings] = useState(args.settings)
    const [priority, setPriority] = useState<SharePriority>(args.priority)
    const [mode, setMode] = useState<StreamModeChoice | undefined>(args.streamMode)
    return (
      <ShareSetupDialogView
        {...args}
        streamMode={mode}
        onStreamModeChange={(next) => {
          args.onStreamModeChange?.(next)
          setMode(next)
        }}
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
  args: { settings: { source: 'screen', resolution: '1080p', fps: 60, includeAudio: true, audioApps: [] } },
}

export const BrowserTab: Story = {
  args: { settings: { source: 'tab', resolution: '720p', fps: 30, includeAudio: true, audioApps: [] } },
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
      audioApps: [],
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

/** Janela ou jogo: o browser não captura o áudio de uma janela só. Switch travado, só o microfone vai. */
export const WindowAudioUnavailable: Story = {
  play: async () => {
    await expect(screen.getByRole('switch', { name: /share audio/i })).toBeDisabled()
    await expect(screen.getByRole('switch', { name: /share audio/i })).not.toBeChecked()
    await waitFor(() => expect(screen.getByText(/only your microphone/i)).toBeVisible())
  },
}

/** Tela inteira no Linux: o browser só tem áudio de aba. Switch travado, só o microfone vai. */
export const ScreenAudioUnavailable: Story = {
  args: {
    audioSupport: 'tabOnly',
    settings: { source: 'screen', resolution: '1080p', fps: 60, includeAudio: true, audioApps: [] },
  },
  play: async () => {
    await expect(screen.getByRole('switch', { name: /share audio/i })).toBeDisabled()
    await expect(screen.getByText(/entire screen/i, { selector: 'p' })).toHaveClass('text-amber-500')
  },
}

/** Firefox e Safari não capturam áudio de tela. */
export const BrowserWithoutAudio: Story = {
  args: { audioSupport: 'browserUnsupported' },
  play: async () => {
    await expect(screen.getByRole('switch', { name: /share audio/i })).toBeDisabled()
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

/** Servidor (SFU) vem marcado; trocar para Direto (Mesh) chega ao ViewModel. */
export const ChooseStreamMode: Story = {
  play: async ({ args, userEvent }) => {
    const server = await screen.findByRole('radio', { name: /server \(sfu\)/i })
    await expect(server).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => expect(screen.getByText(/without splitting your upload/i)).toBeVisible())
    await userEvent.click(screen.getByRole('radio', { name: /direct \(mesh\)/i }))
    await expect(args.onStreamModeChange).toHaveBeenCalledWith('mesh')
  },
}

/** SFU desligado no servidor: aparece travado, com o motivo, e só o Direto fica. */
export const ServerModeTurnedOff: Story = {
  args: {
    streamMode: 'mesh',
    streamModes: { sfu: { available: false, reason: 'disabled' }, mesh: { available: true } },
  },
  play: async () => {
    await expect(await screen.findByRole('radio', { name: /server \(sfu\)/i })).toBeDisabled()
    await waitFor(() => expect(screen.getByText(/turned off for this server\./i)).toBeVisible())
  },
}

/** Os dois modos desligados: nada para escolher e o botão de começar travado. */
export const SharingTurnedOff: Story = {
  args: {
    streamMode: undefined,
    streamModes: { sfu: { available: false, reason: 'disabled' }, mesh: { available: false } },
  },
  play: async () => {
    await waitFor(() => expect(screen.getByText(/screen sharing is turned off for this server/i)).toBeVisible())
    await expect(screen.getByRole('button', { name: /choose and share/i })).toBeDisabled()
  },
}

const PLAYING = [
  { name: 'Spotify', binary: 'spotify' },
  { name: 'Cyberpunk 2077', binary: 'cyberpunk' },
]

/** Desktop on Linux: the sound is the applications', chosen from what is playing, whichever source is shared. */
export const ApplicationAudio: Story = {
  args: {
    settings: { source: 'window', resolution: '1080p', fps: 60, includeAudio: true, audioApps: ['Spotify'] },
    audioSupport: 'apps',
    audioApps: { available: PLAYING, onRefresh: fn() },
  },
  play: async ({ userEvent, args }) => {
    await expect(screen.getByLabelText('Spotify')).toBeChecked()
    await userEvent.click(screen.getByLabelText('Cyberpunk 2077'))
    await waitFor(() => expect(screen.getByLabelText('Cyberpunk 2077')).toBeChecked())
    await userEvent.click(screen.getByRole('button', { name: /refresh/i }))
    await expect(args.audioApps?.onRefresh).toHaveBeenCalled()
  },
}

export const ApplicationAudioNothingPlaying: Story = {
  args: {
    settings: { source: 'screen', resolution: '1080p', fps: 30, includeAudio: true, audioApps: [] },
    audioSupport: 'apps',
    audioApps: { available: [], onRefresh: fn() },
  },
  play: async () => {
    await expect(await screen.findByText(/no application is playing sound/i)).toBeVisible()
    await expect(screen.getByText(/at least one application/i)).toBeVisible()
  },
}

/** Chosen before and not playing now: it stays on the list, so it can be unticked. */
export const ApplicationAudioRemembered: Story = {
  args: {
    settings: { source: 'window', resolution: '1080p', fps: 60, includeAudio: true, audioApps: ['Old game'] },
    audioSupport: 'apps',
    audioApps: { available: PLAYING, onRefresh: fn() },
  },
  play: async () => {
    await expect(await screen.findByLabelText(/old game/i)).toBeChecked()
    await expect(screen.getByText(/not playing now/i)).toBeVisible()
  },
}

/** Desktop on Windows or X11: the app lists the screens and windows, and the dialog is where the user picks. */
export const DesktopSourceList: Story = {
  args: {
    settings: { source: 'screen', resolution: '1080p', fps: 60, includeAudio: false, audioApps: [] },
    audioSupport: 'supported',
    sources: { available: captureSources, selectedId: 'screen:0:0', onSelect: fn(), onRefresh: fn() },
  },
  play: async ({ args, userEvent }) => {
    await expect(screen.getByRole('radio', { name: 'Entire screen' })).toBeChecked()
    await expect(screen.queryByRole('radio', { name: /browser tab/i })).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: 'Cyberpunk 2077' }))
    await expect(args.sources?.onSelect).toHaveBeenCalledWith('window:590528:0')
    await expect(screen.getByRole('button', { name: /choose and share/i })).toBeEnabled()
  },
}

/** Nothing picked (an empty list): there is nothing to capture, so the share cannot start. */
export const DesktopSourceListNothingToShare: Story = {
  args: {
    audioSupport: 'supported',
    sources: { available: [], selectedId: null, onSelect: fn(), onRefresh: fn() },
  },
  play: async ({ args, userEvent }) => {
    await expect(screen.getByText(/no screen or window found/i)).toBeVisible()
    await expect(screen.getByRole('button', { name: /choose and share/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /refresh/i }))
    await expect(args.sources?.onRefresh).toHaveBeenCalled()
  },
}

/** Desktop on Wayland: the app cannot list, the system asks when the share starts. */
export const DesktopSystemPicker: Story = {
  args: { audioSupport: 'supported', systemPicker: true },
  play: async () => {
    await expect(screen.getByText(/the system will ask which screen or window/i)).toBeVisible()
    await expect(screen.queryByRole('radio', { name: /browser tab/i })).toBeNull()
    await expect(screen.getByRole('button', { name: /choose and share/i })).toBeEnabled()
  },
}

/** Desktop on Windows: the sound of the computer without the call, whichever source is shared. */
export const DesktopSystemAudioWithoutApp: Story = {
  args: {
    settings: { source: 'window', resolution: '1080p', fps: 60, includeAudio: true, audioApps: [] },
    audioSupport: 'systemWithoutApp',
  },
  play: async () => {
    await expect(screen.getByText(/without the call/i)).toBeVisible()
    await expect(screen.getByRole('switch', { name: /share audio/i })).toBeEnabled()
  },
}
