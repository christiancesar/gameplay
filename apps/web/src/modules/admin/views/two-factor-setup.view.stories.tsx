import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { fakeQrCode, recoveryCodes } from '@/fixtures/admin'

import { TwoFactorSetupView } from './two-factor-setup.view'
import type { TwoFactorSetupState } from '@/modules/admin/model/entities/two-factor-setup-state'

const scan: TwoFactorSetupState = {
  step: 'scan',
  qrCodeUrl: fakeQrCode,
  secret: 'JBSW Y3DP EHPK 3PXP',
  isVerifying: false,
  invalidCode: false,
}

const meta = {
  title: 'Admin/TwoFactorSetup',
  component: TwoFactorSetupView,
  parameters: { layout: 'fullscreen' },
  args: {
    state: scan,
    onConfirmPassword: fn(),
    onVerify: fn(),
    onCopyCodes: fn(),
    onDownloadCodes: fn(),
    onFinish: fn(),
    onBackToHub: fn(),
  },
} satisfies Meta<typeof TwoFactorSetupView>

export default meta
type Story = StoryObj<typeof meta>

/** Primeiro passo: confirmar a senha, que o Better Auth exige para ligar o 2FA. */
export const ConfirmPassword: Story = {
  args: { state: { step: 'password', isSubmitting: false, invalidPassword: false } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /continue/i }))
    await expect(await canvas.findByText(/this field is required/i)).toBeVisible()
    await userEvent.type(canvas.getByLabelText(/^password$/i), 'hunter2222')
    await userEvent.click(canvas.getByRole('button', { name: /continue/i }))
    await expect(args.onConfirmPassword).toHaveBeenCalledWith({ password: 'hunter2222' }, expect.anything())
  },
}

export const WrongPassword: Story = {
  args: { state: { step: 'password', isSubmitting: false, invalidPassword: true } },
}

export const ScanQrCode: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const verify = canvas.getByRole('button', { name: /verify/i })
    await userEvent.type(canvas.getByLabelText(/6-digit code/i), '1234')
    await userEvent.click(verify)
    await expect(await canvas.findByText(/enter the 6 digits/i)).toBeVisible()
    await expect(args.onVerify).not.toHaveBeenCalled()

    await userEvent.type(canvas.getByLabelText(/6-digit code/i), '56')
    await userEvent.click(verify)
    await expect(args.onVerify).toHaveBeenCalledWith({ code: '123456' }, expect.anything())
  },
}

export const Verifying: Story = { args: { state: { ...scan, isVerifying: true } } }

export const InvalidCode: Story = { args: { state: { ...scan, invalidCode: true } } }

export const RecoveryCodes: Story = {
  args: { state: { step: 'recovery', recoveryCodes, copied: false } },
  // 2FA is already on and the codes show only once: no way out before saving them.
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /back to hub/i })).toBeNull()
  },
}

export const RecoveryCodesCopied: Story = { args: { state: { step: 'recovery', recoveryCodes, copied: true } } }

/** Fora do passo dos códigos, dá para desistir e voltar ao Hub. */
export const BackToHub: Story = {
  args: { state: { step: 'password', isSubmitting: false, invalidPassword: false } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /back to hub/i }))
    await expect(args.onBackToHub).toHaveBeenCalled()
  },
}
