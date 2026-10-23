import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn } from 'storybook/test'

import { languageOptions, useStoryLanguage } from './auth-story-helpers'
import { SignInView, type SignInField } from './sign-in.view'

const emptyValues: Record<SignInField, string> = { identifier: '', password: '', twoFactorCode: '' }

const meta = {
  title: 'Auth/SignIn',
  component: SignInView,
  parameters: { layout: 'fullscreen' },
  args: {
    step: 'credentials',
    values: emptyValues,
    useRecoveryCode: false,
    isSubmitting: false,
    language: 'en',
    languageOptions,
    onLanguageChange: fn(),
    onChange: fn(),
    onSubmit: fn(),
    onToggleRecoveryCode: fn(),
    onBackToCredentials: fn(),
    onSignUpClick: fn(),
  },
  render: function Render(args) {
    const [values, setValues] = useState(args.values)
    const language = useStoryLanguage()
    return (
      <SignInView
        {...args}
        {...language}
        values={values}
        onChange={(field, value) => {
          args.onChange(field, value)
          setValues((current) => ({ ...current, [field]: value }))
        }}
      />
    )
  },
} satisfies Meta<typeof SignInView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = {
  args: { values: { identifier: 'shinigame', password: 'hunter22', twoFactorCode: '' } },
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
  args: { step: 'twoFactor', values: { ...emptyValues, twoFactorCode: '123456' }, formError: 'invalidTwoFactorCode' },
}

export const TwoFactorRecoveryCode: Story = {
  args: { step: 'twoFactor', useRecoveryCode: true },
}

export const SubmitCredentials: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/email or username/i), 'shinigame')
    await userEvent.type(canvas.getByLabelText(/^password$/i), 'hunter22')
    await userEvent.click(canvas.getByRole('button', { name: /login/i }))

    await expect(args.onChange).toHaveBeenLastCalledWith('password', 'hunter22')
    await expect(args.onSubmit).toHaveBeenCalledOnce()
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
    await userEvent.type(canvas.getByLabelText(/authentication code/i), '12ab3456')
    await expect(args.onChange).toHaveBeenLastCalledWith('twoFactorCode', '123456')

    await userEvent.click(canvas.getByRole('button', { name: /use a recovery code/i }))
    await expect(args.onToggleRecoveryCode).toHaveBeenCalledOnce()
  },
}

export const Portuguese: Story = {
  globals: { locale: 'pt' },
}
