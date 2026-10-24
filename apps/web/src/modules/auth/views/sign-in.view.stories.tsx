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
    isSubmitting: false,
    language: 'en',
    languageOptions,
    onLanguageChange: fn(),
    onSubmit: fn(),
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
  args: { defaultValues: { identifier: 'shinigame', password: 'hunter22' } },
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

export const SubmitCredentials: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/email or username/i), 'shinigame')
    await userEvent.type(canvas.getByLabelText(/^password$/i), 'hunter22')
    await userEvent.click(canvas.getByRole('button', { name: /login/i }))

    await expect(args.onSubmit).toHaveBeenCalledWith(
      { identifier: 'shinigame', password: 'hunter22' },
      expect.anything(),
    )
  },
}

/** Validação do schema: enviar vazio mostra os erros e não chama o ViewModel. */
export const SubmitEmpty: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /login/i }))

    await expect(await canvas.findAllByText(/this field is required/i)).toHaveLength(2)
    await expect(canvas.getByLabelText(/^password$/i)).toHaveAttribute('aria-invalid', 'true')
    await expect(args.onSubmit).not.toHaveBeenCalled()

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

/** Entrou com um browser que não é Chromium. */
export const UnsupportedBrowser: Story = {
  args: {
    notice: (
      <BrowserSupportAlertView
        status={{ type: 'unsupported', browser: { name: 'Firefox', version: '144' } }}
        onDismiss={fn()}
      />
    ),
  },
}

export const Portuguese: Story = {
  globals: { locale: 'pt' },
}
