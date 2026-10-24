import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, waitFor } from 'storybook/test'

import { LanguageSwitcher } from './language-switcher'

const meta = {
  title: 'Shared/UI/LanguageSwitcher',
  component: LanguageSwitcher,
  args: {
    value: 'en',
    options: [
      { value: 'en', label: 'EN' },
      { value: 'pt', label: 'PT' },
    ],
    ariaLabel: 'Language',
    onChange: fn(),
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return (
      <LanguageSwitcher
        {...args}
        value={value}
        onChange={(next) => {
          args.onChange(next)
          setValue(next)
        }}
      />
    )
  },
} satisfies Meta<typeof LanguageSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const English: Story = {}

export const Portuguese: Story = { args: { value: 'pt' } }

export const SwitchLanguage: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'PT' }))
    await expect(args.onChange).toHaveBeenCalledWith('pt')
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'PT' })).toBeChecked())
  },
}

export const ClickActiveKeepsValue: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'EN' }))
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}
