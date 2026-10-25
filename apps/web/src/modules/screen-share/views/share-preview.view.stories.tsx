import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { SharePreviewView } from './share-preview.view'

const meta = {
  title: 'ScreenShare/SharePreview',
  component: SharePreviewView,
  decorators: [(Story) => <div className="w-96">{Story()}</div>],
  args: {
    video: <div className="size-full bg-gradient-to-br from-slate-700 to-slate-900" aria-label="Local screen" />,
    hidden: false,
    onToggleHidden: fn(),
    onStop: fn(),
  },
} satisfies Meta<typeof SharePreviewView>

export default meta
type Story = StoryObj<typeof meta>

export const Presenting: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('You are presenting to everyone')).toBeVisible()
    await expect(canvas.getByLabelText('Local screen')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /hide preview/i }))
    await expect(args.onToggleHidden).toHaveBeenCalledOnce()
    await userEvent.click(canvas.getByRole('button', { name: /stop presenting/i }))
    await expect(args.onStop).toHaveBeenCalledOnce()
  },
}

export const PreviewHidden: Story = {
  args: { hidden: true },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.queryByLabelText('Local screen')).toBeNull()
    await expect(canvas.getByText(/avoid a mirror effect/i)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /show preview/i }))
    await expect(args.onToggleHidden).toHaveBeenCalledOnce()
  },
}
