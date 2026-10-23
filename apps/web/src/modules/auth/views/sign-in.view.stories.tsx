import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { languageOptions, useStoryLanguage } from '@/fixtures/language'
import { BrowserSupportAlertView } from '@/modules/browser-support/views/browser-support-alert.view'

import { SignInView } from './sign-in.view'

const meta = {
  title: 'Auth/SignIn',
  component: SignInView,
  parameters: { layout: 'fullscreen' },
  args: {
    step: 'credentials',
    useRecoveryCode: false,
    isSubmitting: false,
    language: 'en',
    languageOptions,
    onLanguageChange: fn(),
    onSubmitCredentials: fn(),
    onSubmitTwoFactor: fn(),
    onToggleRecoveryCode: fn(),
    onBackToCredentials: fn(),
    onSignUpClick: fn(),
  },
  render: function Render(args) {
    const language = useStoryLanguage()
    return <SignInView {...args} {...language} />
  },
} satisfies Meta<typeof SignInView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = {
  args: { defaultCredentials: { identifier: 'shinigame', password: 'hunter22' } },
}

export const Submitting: Story = {
  args: { ...Filled.args, isSubmitting: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /login/i })).toBeDisabled()
  },
}

export const InvalidCredentials: Story = {
  args: { ...Filled.args, formError: 'invalidCredentials' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/invalid credentials/i)).toBeVisible()
    await expect(canvas.getByLabelText(/password/i)).toHaveAttribute('aria-invalid', 'true')
  },
}

export const AccountSuspended: Story = {
  args: { ...Filled.args, formError: 'accountSuspended' },
}

export const TooManyAttempts: Story = {
  args: { ...Filled.args, formError: 'tooManyAttempts' },
}

export const TwoFactor: Story = {
  args: { step: 'twoFactor' },
}

export const TwoFactorInvalid: Story = {
  args: { step: 'twoFactor', formError: 'invalidTwoFactorCode' },
}

export const TwoFactorRecoveryCode: Story = {
  args: { step: 'twoFactor', useRecoveryCode: true },
}

export const SubmitCredentials: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/email or username/i), 'shinigame')
    await userEvent.type(canvas.getByLabelText(/^password$/i), 'hunter22')
    await userEvent.click(canvas.getByRole('button', { name: /login/i }))

    await expect(args.onSubmitCredentials).toHaveBeenCalledWith({ identifier: 'shinigame', password: 'hunter22' }, expect.anything())
  },
}

/** Validação do schema: enviar vazio mostra os erros e não chama o ViewModel. */
export const SubmitEmpty: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /login/i }))

    await expect(await canvas.findAllByText(/this field is required/i)).toHaveLength(2)
    await expect(canvas.getByLabelText(/^password$/i)).toHaveAttribute('aria-invalid', 'true')
    await expect(args.onSubmitCredentials).not.toHaveBeenCalled()

    // O erro some assim que o campo fica válido.
    await userEvent.type(canvas.getByLabelText(/email or username/i), 'shinigame')
    await expect(canvas.getAllByText(/this field is required/i)).toHaveLength(1)
  },
}

export const GoToSignUp: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /sign up/i }))
    await expect(args.onSignUpClick).toHaveBeenCalledOnce()
  },
}

export const TypeTwoFactorCode: Story = {
  args: { step: 'twoFactor' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/authentication code/i), '12ab345')
    await userEvent.click(canvas.getByRole('button', { name: /verify/i }))
    await expect(await canvas.findByText(/enter the 6 digits/i)).toBeVisible()
    await expect(args.onSubmitTwoFactor).not.toHaveBeenCalled()

    await userEvent.type(canvas.getByLabelText(/authentication code/i), '6')
    await userEvent.click(canvas.getByRole('button', { name: /verify/i }))
    await expect(args.onSubmitTwoFactor).toHaveBeenCalledWith({ code: '123456' }, expect.anything())

    await userEvent.click(canvas.getByRole('button', { name: /use a recovery code/i }))
    await expect(args.onToggleRecoveryCode).toHaveBeenCalledOnce()
  },
}

/** Entrou com um browser que não é Chromium. */
export const UnsupportedBrowser: Story = {
  args: { notice: <BrowserSupportAlertView status={{ type: 'unsupported', browser: { name: 'Firefox', version: '144' } }} onDismiss={fn()} /> },
}

export const Portuguese: Story = {
  globals: { locale: 'pt' },
}
