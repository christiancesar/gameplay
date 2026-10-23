import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn } from 'storybook/test'

import { fakeQrCode, recoveryCodes } from '@/fixtures/admin'

import { TwoFactorSetupView, type TwoFactorSetupState } from './two-factor-setup.view'

const scan: TwoFactorSetupState = {
  step: 'scan',
  qrCodeUrl: fakeQrCode,
  secret: 'JBSW Y3DP EHPK 3PXP',
  code: '',
  isVerifying: false,
  invalidCode: false,
}

const meta = {
  title: 'Admin/TwoFactorSetup',
  component: TwoFactorSetupView,
  parameters: { layout: 'fullscreen' },
  args: {
    state: scan,
    onCodeChange: fn(),
    onVerify: fn(),
    onCopyCodes: fn(),
    onDownloadCodes: fn(),
    onFinish: fn(),
  },
  render: function Render(args) {
    const [code, setCode] = useState(args.state.step === 'scan' ? args.state.code : '')
    const state = args.state.step === 'scan' ? { ...args.state, code } : args.state
    return (
      <TwoFactorSetupView
        {...args}
        state={state}
        onCodeChange={(value) => {
          args.onCodeChange(value)
          setCode(value)
        }}
      />
    )
  },
} satisfies Meta<typeof TwoFactorSetupView>

export default meta
type Story = StoryObj<typeof meta>

export const ScanQrCode: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const verify = canvas.getByRole('button', { name: /verify/i })
    await expect(verify).toBeDisabled()
    await userEvent.type(canvas.getByLabelText(/6-digit code/i), '123456')
    await userEvent.click(verify)
    await expect(args.onVerify).toHaveBeenCalledOnce()
  },
}

export const Verifying: Story = { args: { state: { ...scan, code: '123456', isVerifying: true } } }

export const InvalidCode: Story = { args: { state: { ...scan, code: '123456', invalidCode: true } } }

export const RecoveryCodes: Story = { args: { state: { step: 'recovery', recoveryCodes, copied: false } } }

export const RecoveryCodesCopied: Story = { args: { state: { step: 'recovery', recoveryCodes, copied: true } } }
