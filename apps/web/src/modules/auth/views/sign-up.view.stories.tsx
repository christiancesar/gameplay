import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn } from 'storybook/test'

import { languageOptions, useStoryLanguage } from './auth-story-helpers'
import { SignUpView, type SignUpField } from './sign-up.view'

const emptyValues: Record<SignUpField, string> = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  inviteKey: '',
}

const filledValues: Record<SignUpField, string> = {
  username: 'shinigame',
  email: 'shinigame@gameplay.com',
  password: 'hunter2222',
  confirmPassword: 'hunter2222',
  inviteKey: 'K7MX4P',
}

const meta = {
  title: 'Auth/SignUp',
  component: SignUpView,
  parameters: { layout: 'fullscreen' },
  args: {
    values: emptyValues,
    fieldErrors: {},
    isSubmitting: false,
    language: 'en',
    languageOptions,
    onLanguageChange: fn(),
    onChange: fn(),
    onSubmit: fn(),
    onSignInClick: fn(),
  },
  render: function Render(args) {
    const [values, setValues] = useState(args.values)
    const language = useStoryLanguage()
    return (
      <SignUpView
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
} satisfies Meta<typeof SignUpView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = { args: { values: filledValues } }

export const FromServerInvite: Story = { args: { invitedServerName: 'Turbex' } }

export const Submitting: Story = {
  args: { values: filledValues, isSubmitting: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /create account/i })).toBeDisabled()
  },
}

export const FieldErrors: Story = {
  args: {
    values: { ...filledValues, password: 'short', confirmPassword: 'shorter', inviteKey: 'K7M' },
    fieldErrors: {
      username: 'usernameTaken',
      email: 'emailTaken',
      password: 'passwordTooShort',
      confirmPassword: 'passwordMismatch',
      inviteKey: 'inviteKeyIncomplete',
    },
  },
}

export const InviteKeyExpired: Story = {
  args: { values: filledValues, fieldErrors: { inviteKey: 'inviteKeyExpired' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/invite key has expired/i)).toBeVisible()
    // Os outros campos continuam preenchidos.
    await expect(canvas.getByLabelText(/^username$/i)).toHaveValue('shinigame')
  },
}

export const InviteKeyUsed: Story = {
  args: { values: filledValues, fieldErrors: { inviteKey: 'inviteKeyUsed' } },
}

export const InviteKeyRevoked: Story = {
  args: { values: filledValues, fieldErrors: { inviteKey: 'inviteKeyRevoked' } },
}

export const TooManyAttempts: Story = {
  args: { values: filledValues, fieldErrors: { inviteKey: 'tooManyAttempts' } },
}

export const UnexpectedError: Story = {
  args: { values: filledValues, formError: 'unexpected' },
}

export const PasteInviteKey: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText(/invite key/i))
    await userEvent.paste('k7mx4p')
    await expect(args.onChange).toHaveBeenLastCalledWith('inviteKey', 'k7mx4p')
  },
}

export const SubmitForm: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/^username$/i), 'shinigame')
    await userEvent.type(canvas.getByLabelText(/^email$/i), 'shinigame@gameplay.com')
    await userEvent.type(canvas.getByLabelText(/^password$/i), 'hunter2222')
    await userEvent.type(canvas.getByLabelText(/confirm password/i), 'hunter2222')
    await userEvent.click(canvas.getByRole('button', { name: /create account/i }))
    await expect(args.onSubmit).toHaveBeenCalledOnce()
  },
}

export const GoToSignIn: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /sign in/i }))
    await expect(args.onSignInClick).toHaveBeenCalledOnce()
  },
}

export const Portuguese: Story = {
  args: { invitedServerName: 'Turbex' },
  globals: { locale: 'pt' },
}
