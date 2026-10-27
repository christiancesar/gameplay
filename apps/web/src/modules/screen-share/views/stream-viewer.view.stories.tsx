import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen } from 'storybook/test'

import { images } from '@/fixtures'
import { stageLongNames, stageWithLive } from '@/fixtures/server'

import { StreamViewerView } from './stream-viewer.view'

const meta = {
  title: 'ScreenShare/StreamViewer',
  component: StreamViewerView,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="h-dvh">{Story()}</div>],
  args: {
    streamerName: 'Kisnaider',
    video: <img src={images.streamFrame} alt="" className="max-h-full max-w-full object-contain" />,
    liveStreams: [{ id: 'u3', name: 'Kisnaider' }],
    currentStreamId: 'u3',
    streamVolume: 80,
    participants: stageWithLive,
    onSwitchStream: fn(),
    onStopWatching: fn(),
    onImmersiveChange: fn(),
    onStreamVolumeChange: fn(),
    qualityLevel: 'auto',
    onQualityLevelChange: fn(),
    onWatch: fn(),
    onVolumeChange: fn(),
  },
} satisfies Meta<typeof StreamViewerView>

export default meta
type Story = StoryObj<typeof meta>

/** Mostra o que chega para quem assiste, medido no próprio browser. */
export const Watching: Story = {
  args: { received: { width: 1920, height: 1080, fps: 59.6, kbps: 7800 } },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('What reaches you: 1080p, 60 fps, 7.8 Mbps')).toBeVisible()
  },
}

/** A transmissão não tem áudio: aviso no lugar do ícone e volume desligado. */
export const WithoutAudio: Story = {
  args: { hasAudio: false, received: { width: 1280, height: 720, fps: 42, kbps: 2100 } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('This stream has no audio')).toBeVisible()
    await expect(canvas.getByRole('slider', { name: /stream volume/i })).toHaveAttribute('data-disabled')
  },
}

/** O vídeo ocupa a tela toda, com os controles por cima. Botão volta para o layout normal. */
export const Immersive: Story = {
  args: { immersive: true, received: { width: 1920, height: 1080, fps: 59.6, kbps: 7800 } },
  play: async ({ args, canvasElement, canvas, userEvent }) => {
    const root = canvasElement.querySelector('[data-stream-stage]')
    await expect(root).toHaveAttribute('data-immersive', 'true')
    await expect(root).toHaveAttribute('data-controls', 'shown')
    await expect(canvas.getByRole('slider', { name: /stream volume/i })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /exit fullscreen/i }))
    await expect(args.onImmersiveChange).toHaveBeenCalledWith(false)
  },
}

/** Um toque no vídeo esconde e mostra os controles. */
export const ImmersiveControlsHidden: Story = {
  args: { immersive: true },
  play: async ({ canvasElement, canvas, userEvent }) => {
    const root = canvasElement.querySelector('[data-stream-stage]')
    await userEvent.click(canvas.getByRole('button', { name: /show or hide controls/i }))
    await expect(root).toHaveAttribute('data-controls', 'hidden')
    await userEvent.click(canvas.getByRole('button', { name: /show or hide controls/i }))
    await expect(root).toHaveAttribute('data-controls', 'shown')
  },
}

/** As pessoas abrem numa coluna por cima do vídeo. */
export const ImmersivePeople: Story = {
  args: { immersive: true },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByRole('button', { name: /volume for/i })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /^people$/i }))
    await expect(canvas.getAllByRole('button', { name: /volume for/i }).length).toBeGreaterThan(0)
  },
}

/** Celular deitado: o ViewModel liga o modo imersivo sozinho. */
export const PhoneLandscape: Story = {
  args: { immersive: true, sidebarTrigger: <button type="button">Sidebar</button> },
  globals: { viewport: { value: 'mobile1', isRotated: true } },
}

/** Botão de tela cheia pede o modo imersivo. */
export const EnterFullscreen: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^fullscreen$/i }))
    await expect(args.onImmersiveChange).toHaveBeenCalledWith(true)
  },
}

export const LongNames: Story = { args: { participants: stageLongNames } }

export const MultipleStreams: Story = {
  args: {
    liveStreams: [
      { id: 'u3', name: 'Kisnaider' },
      { id: 'u4', name: 'Marreta' },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Marreta' }))
    await expect(args.onSwitchStream).toHaveBeenCalledWith('u4')
  },
}

export const StopWatching: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /stop watching/i }))
    await expect(args.onStopWatching).toHaveBeenCalledOnce()
  },
}

/** Quem assiste escolhe quanto baixar: Auto, Alta, Média ou Baixa. */
export const ChooseQuality: Story = {
  args: { received: { width: 1920, height: 1080, fps: 59.6, kbps: 7800 } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: /quality/i }))
    await userEvent.click(await screen.findByRole('option', { name: 'Low' }))
    await expect(args.onQualityLevelChange).toHaveBeenCalledWith('low')
  },
}
