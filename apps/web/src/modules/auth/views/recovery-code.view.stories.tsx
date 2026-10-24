import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { languageOptions, useStoryLanguage } from '@/fixtures/language'

import { RecoveryCodeView } from './recovery-code.view'

const meta = {
  title: 'Auth/RecoveryCode',
  component: RecoveryCodeView,
  parameters: { layout: 'fullscreen' },
  args: {
    isSubmitting: false,
    language: 'en',
    languageOptions,
    onLanguageChange: fn(),
    onSubmit: fn(),
    onUseAuthenticatorClick: fn(),
    onBack: fn(),
  },
  render: function Render(args) {
    const language = useStoryLanguage()
    return <RecoveryCodeView {...args} {...language} />
  },
} satisfies Meta<typeof RecoveryCodeView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const InvalidCode: Story = {
  args: { formError: 'invalidTwoFactorCode' },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/recovery code/i)).toHaveAttribute('aria-invalid', 'true')
  },
}

/** Validação do schema: enviar vazio mostra o erro e não chama o ViewModel. */
export const SubmitCode: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /verify/i }))
    await expect(await canvas.findByText(/this field is required/i)).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()

    await userEvent.type(canvas.getByLabelText(/recovery code/i), 'ab12-cd34')
    await userEvent.click(canvas.getByRole('button', { name: /verify/i }))
    await expect(args.onSubmit).toHaveBeenCalledWith({ code: 'ab12-cd34' }, expect.anything())
  },
}

export const GoToAuthenticator: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /use authenticator code/i }))
    await expect(args.onUseAuthenticatorClick).toHaveBeenCalledOnce()
  },
}

export const Portuguese: Story = {
  globals: { locale: 'pt' },
}
