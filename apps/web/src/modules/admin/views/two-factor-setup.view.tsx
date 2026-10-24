import { CheckIcon, CopyIcon, DownloadIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type TwoFactorCodeValues } from '@/modules/auth/model/two-factor.schema'
import { BrandLogo } from '@/shared/ui/brand-logo'
import { Button } from '@/shared/ui/button'

import { VerifyCodeForm } from './two-factor-verify-form.view'

type TwoFactorSetupState =
  | {
      step: 'scan'
      qrCodeUrl: string
      secret: string
      isVerifying: boolean
      /** Servidor recusou o código. */ invalidCode: boolean
    }
  | { step: 'recovery'; recoveryCodes: readonly string[]; copied: boolean }

type TwoFactorSetupViewProps = {
  state: TwoFactorSetupState
  /** Chamado só com um código de 6 dígitos. */
  onVerify: (values: TwoFactorCodeValues) => void
  onCopyCodes: () => void
  onDownloadCodes: () => void
  onFinish: () => void
}

/** F12.1: primeiro login do admin da plataforma. */
function TwoFactorSetupView({ state, onVerify, onCopyCodes, onDownloadCodes, onFinish }: TwoFactorSetupViewProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <BrandLogo className="w-36" />
      <div className="bg-card text-card-foreground flex w-full max-w-md flex-col gap-6 rounded-lg border p-6">
        {state.step === 'scan' ? (
          <>
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-xl font-medium">{t('admin.setup.title')}</h1>
              <p className="text-muted-foreground text-sm">{t('admin.setup.description')}</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <p className="self-start text-sm">{t('admin.setup.scan')}</p>
              <img src={state.qrCodeUrl} alt="QR code" className="size-44 rounded-md bg-white p-2" />
              <p className="text-muted-foreground text-xs">{t('admin.setup.manual')}</p>
              <code className="bg-muted rounded-sm px-2 py-1 font-mono text-xs tracking-wider break-all">
                {state.secret}
              </code>
            </div>
            <VerifyCodeForm isVerifying={state.isVerifying} invalidCode={state.invalidCode} onVerify={onVerify} />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-xl font-medium">{t('admin.setup.recoveryTitle')}</h1>
              <p className="text-muted-foreground text-sm">{t('admin.setup.recoveryDescription')}</p>
            </div>
            <ol className="bg-muted grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md p-4 font-mono text-sm">
              {state.recoveryCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ol>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onCopyCodes}>
                {state.copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
                {state.copied ? t('common.copied') : t('admin.setup.copyAll')}
              </Button>
              <Button variant="outline" className="flex-1" onClick={onDownloadCodes}>
                <DownloadIcon data-icon="inline-start" />
                {t('admin.setup.download')}
              </Button>
            </div>
            <Button size="lg" onClick={onFinish}>
              {t('admin.setup.saved')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export { TwoFactorSetupView }
export type { TwoFactorSetupState, TwoFactorSetupViewProps }
