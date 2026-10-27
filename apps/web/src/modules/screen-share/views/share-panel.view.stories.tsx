import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor } from 'storybook/test'

import {
  liveLimitedByCpu,
  liveLimitedByNetwork,
  liveNoViewers,
  liveOnTarget,
  liveThroughSfu,
  liveWithoutAudio,
  viewerQualities,
} from '@/fixtures/server'

import { ShareDetailsDialogView } from './share-details-dialog.view'
import { SharePanelView } from './share-panel.view'

const meta = {
  title: 'ScreenShare/SharePanel',
  component: SharePanelView,
  decorators: [(Story) => <div className="w-66">{Story()}</div>],
  args: {
    state: { status: 'idle' },
    onStart: fn(),
    onStop: fn(),
    onOpenDetails: fn(),
  },
} satisfies Meta<typeof SharePanelView>

export default meta
type Story = StoryObj<typeof meta>

/** Botão verde: abre o modal de configuração (ShareSetupDialog). */
export const Idle: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /share screen/i }))
    await expect(args.onStart).toHaveBeenCalledOnce()
  },
}

/** Seletor nativo do browser aberto. */
export const WaitingBrowserPicker: Story = { args: { state: { status: 'picking' } } }

/** O áudio foi pedido e o browser não entregou: aviso em âmbar no monitor. */
export const LiveWithoutAudio: Story = {
  args: { state: liveWithoutAudio },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Didn't come")).toHaveClass('text-amber-500')
  },
}

export const LiveOnTarget: Story = {
  args: { state: liveOnTarget },
  play: async ({ args, canvas, userEvent }) => {
    // Alvo e entregue iguais.
    await expect(canvas.getAllByText('1080p · 60 fps')).toHaveLength(2)
    await userEvent.click(canvas.getByRole('button', { name: /details/i }))
    await expect(args.onOpenDetails).toHaveBeenCalledOnce()
    await userEvent.click(canvas.getByRole('button', { name: /stop sharing/i }))
    await expect(args.onStop).toHaveBeenCalledOnce()
  },
}

/** Alvo 1080p60, mas a rede só entrega 720p a 42 fps. */
export const LiveLimitedByNetwork: Story = {
  args: { state: liveLimitedByNetwork },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('720p · 42 fps')).toBeVisible()
    await expect(canvas.getByRole('alert')).toHaveTextContent(/limited by your network/i)
  },
}

/** Resolução no alvo, mas o computador não segura os 60 fps. */
export const LiveLimitedByComputer: Story = { args: { state: liveLimitedByCpu } }

export const LiveNoViewers: Story = { args: { state: liveNoViewers } }

/** Clique em "Details": abre o ShareDetailsDialog com a qualidade por espectador. */
export const OpenDetails: Story = {
  args: { state: liveLimitedByNetwork },
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <SharePanelView
          {...args}
          onOpenDetails={() => {
            args.onOpenDetails()
            setOpen(true)
          }}
        />
        <ShareDetailsDialogView
          open={open}
          target={{ resolution: '1080p', fps: 60 }}
          viewers={viewerQualities}
          onOpenChange={setOpen}
        />
      </>
    )
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /details/i }))
    await waitFor(() => expect(screen.getByRole('dialog', { name: /stream quality/i })).toBeVisible())
  },
}

/** Com `onChangeQuality`, o painel ao vivo ganha o botão para trocar resolução e FPS sem parar. */
export const LiveWithChangeQuality: Story = {
  args: { state: liveOnTarget, onChangeQuality: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /change quality/i }))
    await expect(args.onChangeQuality).toHaveBeenCalledOnce()
  },
}

/** Pelo servidor (SFU): selo do modo e o que sobe para o servidor. */
export const LiveThroughServer: Story = {
  args: { state: liveThroughSfu },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Server (SFU)')).toBeVisible()
    await expect(canvas.getByText(/sent to the server/i)).toBeVisible()
  },
}
