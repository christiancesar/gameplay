import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { languageOptions, useStoryLanguage } from '@/fixtures/language'

import { TwoFactorView } from './two-factor.view'

const meta = {
  title: 'Auth/TwoFactor',
  component: TwoFactorView,
  parameters: { layout: 'fullscreen' },
  args: {
    isSubmitting: false,
    language: 'en',
    languageOptions,
    onLanguageChange: fn(),
    onSubmit: fn(),
    onUseRecoveryCodeClick: fn(),
    onBack: fn(),
  },
  render: function Render(args) {
    const language = useStoryLanguage()
    return <TwoFactorView {...args} {...language} />
  },
} satisfies Meta<typeof TwoFactorView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Submitting: Story = {
  args: { isSubmitting: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /verify/i })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: /back to login/i })).toBeDisabled()
  },
}

export const InvalidCode: Story = {
  args: { formError: 'invalidTwoFactorCode' },
}

export const TooManyAttempts: Story = {
  args: { formError: 'tooManyAttempts' },
}

export const TypeCode: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/authentication code/i), '12ab345')
    await userEvent.click(canvas.getByRole('button', { name: /verify/i }))
    await expect(await canvas.findByText(/enter the 6 digits/i)).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()

    await userEvent.type(canvas.getByLabelText(/authentication code/i), '6')
    await userEvent.click(canvas.getByRole('button', { name: /verify/i }))
    await expect(args.onSubmit).toHaveBeenCalledWith({ code: '123456' }, expect.anything())
  },
}

export const GoToRecoveryCode: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /use a recovery code/i }))
    await expect(args.onUseRecoveryCodeClick).toHaveBeenCalledOnce()
  },
}

export const GoBack: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /back to login/i }))
    await expect(args.onBack).toHaveBeenCalledOnce()
  },
}

export const Portuguese: Story = {
  globals: { locale: 'pt' },
}
