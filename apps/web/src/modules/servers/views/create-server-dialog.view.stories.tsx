import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen } from 'storybook/test'

import { images } from '@/fixtures'

import { CreateServerDialogView } from './create-server-dialog.view'

const meta = {
  title: 'Servers/CreateServerDialog',
  component: CreateServerDialogView,
  args: {
    open: true,
    name: '',
    isSubmitting: false,
    onOpenChange: fn(),
    onNameChange: fn(),
    onSelectIcon: fn(),
    onRemoveIcon: fn(),
    onSubmit: fn(),
  },
  render: function Render(args) {
    const [name, setName] = useState(args.name)
    return (
      <CreateServerDialogView
        {...args}
        name={name}
        onNameChange={(value) => {
          args.onNameChange(value)
          setName(value)
        }}
      />
    )
  },
} satisfies Meta<typeof CreateServerDialogView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const NameOnly: Story = { args: { name: 'Clan Zero' } }

export const WithIcon: Story = { args: { name: 'Turbex', iconPreviewUrl: images.serverTurbex } }

export const Submitting: Story = { args: { name: 'Turbex', iconPreviewUrl: images.serverTurbex, isSubmitting: true } }

export const NameRequired: Story = { args: { nameError: 'nameRequired' } }

export const IconTooLarge: Story = { args: { name: 'Turbex', iconError: 'tooLarge' } }

export const IconInvalidType: Story = { args: { name: 'Turbex', iconError: 'invalidType' } }

export const LimitReached: Story = { args: { name: 'Turbex', formError: 'limitReached' } }

export const FillAndSubmit: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.type(screen.getByLabelText(/server name/i), 'Turbex')
    await userEvent.upload(screen.getByLabelText(/choose image/i), new File(['x'], 'icon.png', { type: 'image/png' }))
    await userEvent.click(screen.getByRole('button', { name: /create server/i }))
    await expect(args.onNameChange).toHaveBeenLastCalledWith('Turbex')
    await expect(args.onSelectIcon).toHaveBeenCalledOnce()
    await expect(args.onSubmit).toHaveBeenCalledOnce()
  },
}
