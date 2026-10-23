import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { languageOptions, useStoryLanguage } from '@/fixtures/language'
import type { SignUpInput } from '@/modules/auth/model/sign-up.schema'

import { SignUpView } from './sign-up.view'

const filledValues: SignUpInput = {
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
    isSubmitting: false,
    language: 'en',
    languageOptions,
    onLanguageChange: fn(),
    onSubmit: fn(),
    onSignInClick: fn(),
  },
  render: function Render(args) {
    const language = useStoryLanguage()
    return <SignUpView {...args} {...language} />
  },
} satisfies Meta<typeof SignUpView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Filled: Story = { args: { defaultValues: filledValues } }

export const FromServerInvite: Story = { args: { invitedServerName: 'Turbex' } }

export const Submitting: Story = {
  args: { defaultValues: filledValues, isSubmitting: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /create account/i })).toBeDisabled()
  },
}

/** Validação do schema ao enviar: nada chega ao ViewModel. */
export const FieldErrors: Story = {
  args: {
    defaultValues: { username: 'x', email: 'shinigame@', password: 'short', confirmPassword: 'shorter', inviteKey: 'K7M' },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /create account/i }))
    await expect(await canvas.findByText(/use 3 to 32 letters/i)).toBeVisible()
    await expect(canvas.getByText(/enter a valid email/i)).toBeVisible()
    await expect(canvas.getByText(/at least 8 characters/i)).toBeVisible()
    await expect(canvas.getByText(/invite key has 6 characters/i)).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const PasswordMismatch: Story = {
  args: { defaultValues: { ...filledValues, confirmPassword: 'hunter3333' } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /create account/i }))
    await expect(await canvas.findByText(/passwords don't match/i)).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

/** Erros que só o servidor conhece; somem quando o campo é corrigido. */
export const ServerFieldErrors: Story = {
  args: { defaultValues: filledValues, fieldErrors: { username: 'usernameTaken', email: 'emailTaken' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/username is already taken/i)).toBeVisible()
    await expect(canvas.getByLabelText(/^username$/i)).toHaveAttribute('aria-invalid', 'true')
  },
}

export const InviteKeyExpired: Story = {
  args: { defaultValues: filledValues, fieldErrors: { inviteKey: 'inviteKeyExpired' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/invite key has expired/i)).toBeVisible()
    // Os outros campos continuam preenchidos.
    await expect(canvas.getByLabelText(/^username$/i)).toHaveValue('shinigame')
  },
}

export const InviteKeyUsed: Story = {
  args: { defaultValues: filledValues, fieldErrors: { inviteKey: 'inviteKeyUsed' } },
}

export const InviteKeyRevoked: Story = {
  args: { defaultValues: filledValues, fieldErrors: { inviteKey: 'inviteKeyRevoked' } },
}

export const TooManyAttempts: Story = {
  args: { defaultValues: filledValues, fieldErrors: { inviteKey: 'tooManyAttempts' } },
}

export const UnexpectedError: Story = {
  args: { defaultValues: filledValues, formError: 'unexpected' },
}

export const PasteInviteKey: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText(/invite key/i))
    await userEvent.paste('k7mx4p')
    await expect(canvas.getByLabelText(/invite key/i)).toHaveValue('k7mx4p')
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const SubmitForm: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/^username$/i), 'shinigame')
    await userEvent.type(canvas.getByLabelText(/^email$/i), 'shinigame@gameplay.com')
    await userEvent.type(canvas.getByLabelText(/^password$/i), 'hunter2222')
    await userEvent.type(canvas.getByLabelText(/confirm password/i), 'hunter2222')
    await userEvent.click(canvas.getByLabelText(/invite key/i))
    await userEvent.paste('k7mx4p')
    await userEvent.click(canvas.getByRole('button', { name: /create account/i }))
    // A chave sai em maiúsculas (transform do schema).
    await expect(args.onSubmit).toHaveBeenCalledWith(
      { username: 'shinigame', email: 'shinigame@gameplay.com', password: 'hunter2222', confirmPassword: 'hunter2222', inviteKey: 'K7MX4P' },
      expect.anything(),
    )
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
