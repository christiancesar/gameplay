import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { BrowserSupportAlertView } from './browser-support-alert.view'

const meta = {
  title: 'BrowserSupport/BrowserSupportAlert',
  component: BrowserSupportAlertView,
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
  args: {
    status: { type: 'unsupported', browser: { name: 'Firefox', version: '144' } },
    onDismiss: fn(),
  },
} satisfies Meta<typeof BrowserSupportAlertView>

export default meta
type Story = StoryObj<typeof meta>

export const Firefox: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('link', { name: /brave/i })).toHaveAttribute('href', 'https://brave.com/download/')
    await userEvent.click(canvas.getByRole('button', { name: /continue anyway/i }))
    await expect(args.onDismiss).toHaveBeenCalledOnce()
  },
}

export const Safari: Story = { args: { status: { type: 'unsupported', browser: { name: 'Safari', version: '18.4' } } } }

export const OutdatedChrome: Story = { args: { status: { type: 'outdated', browser: { name: 'Chrome', version: '109' }, minVersion: 130 } } }
