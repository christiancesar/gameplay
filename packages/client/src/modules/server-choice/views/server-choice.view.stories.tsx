import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { languageOptions, useStoryLanguage } from '@/fixtures/language'

import { ServerChoiceView } from './server-choice.view'

const meta = {
  title: 'ServerChoice/ServerChoice',
  component: ServerChoiceView,
  parameters: { layout: 'fullscreen' },
  args: {
    isChecking: false,
    language: 'en',
    languageOptions,
    onLanguageChange: fn(),
    onSubmit: fn(),
  },
  render: function Render(args) {
    const language = useStoryLanguage()
    return <ServerChoiceView {...args} {...language} />
  },
} satisfies Meta<typeof ServerChoiceView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Remembered: Story = { args: { defaultValue: 'https://play.example.com' } }

export const Checking: Story = {
  args: { defaultValue: 'play.example.com', isChecking: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /connect/i })).toBeDisabled()
  },
}

export const Unreachable: Story = {
  args: { defaultValue: 'play.example.com', error: 'unreachable' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/could not reach/i)).toBeVisible()
  },
}

export const NotGameplay: Story = {
  args: { defaultValue: 'example.com', error: 'notGameplay' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/not a gameplay server/i)).toBeVisible()
  },
}

export const Validation: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /connect/i }))
    await expect(canvas.getByText(/enter the address/i)).toBeVisible()

    await userEvent.type(canvas.getByLabelText(/server address/i), 'http://play.example.com')
    await userEvent.click(canvas.getByRole('button', { name: /connect/i }))
    await expect(canvas.getByText(/valid address/i)).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const Submits: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.type(canvas.getByLabelText(/server address/i), 'play.example.com')
    await userEvent.click(canvas.getByRole('button', { name: /connect/i }))
    await expect(args.onSubmit).toHaveBeenCalledWith('play.example.com')
  },
}
