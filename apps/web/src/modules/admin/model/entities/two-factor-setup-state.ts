export type TwoFactorSetupState =
  | { step: 'password'; isSubmitting: boolean; invalidPassword: boolean }
  | {
      step: 'scan'
      qrCodeUrl: string
      secret: string
      isVerifying: boolean
      /** Servidor recusou o código. */ invalidCode: boolean
    }
  | { step: 'recovery'; recoveryCodes: readonly string[]; copied: boolean }
