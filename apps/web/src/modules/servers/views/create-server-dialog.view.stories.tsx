import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { images } from '@/fixtures'

import { CreateServerDialogView } from './create-server-dialog.view'

const meta = {
  title: 'Servers/CreateServerDialog',
  component: CreateServerDialogView,
  args: {
    open: true,
    isSubmitting: false,
    onOpenChange: fn(),
    onSelectIcon: fn(),
    onRemoveIcon: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof CreateServerDialogView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithIcon: Story = { args: { iconPreviewUrl: images.serverTurbex } }

export const Submitting: Story = { args: { iconPreviewUrl: images.serverTurbex, isSubmitting: true } }

/** Validação do schema: enviar sem nome não chega ao ViewModel. */
export const NameRequired: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.click(screen.getByRole('button', { name: /create server/i }))
    await waitFor(() => expect(screen.getByText(/give your server a name/i)).toBeVisible())
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const NameTooLong: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.type(screen.getByLabelText(/server name/i), 'A'.repeat(41))
    await userEvent.click(screen.getByRole('button', { name: /create server/i }))
    await waitFor(() => expect(screen.getByText(/up to 40 characters/i)).toBeVisible())
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const IconTooLarge: Story = { args: { iconError: 'tooLarge' } }

export const IconInvalidType: Story = { args: { iconError: 'invalidType' } }

export const LimitReached: Story = { args: { formError: 'limitReached' } }

export const FillAndSubmit: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.type(screen.getByLabelText(/server name/i), 'Turbex')
    await userEvent.upload(screen.getByLabelText(/choose image/i), new File(['x'], 'icon.png', { type: 'image/png' }))
    await userEvent.click(screen.getByRole('button', { name: /create server/i }))
    await expect(args.onSelectIcon).toHaveBeenCalledOnce()
    await expect(args.onSubmit).toHaveBeenCalledWith({ name: 'Turbex' }, expect.anything())
  },
}
