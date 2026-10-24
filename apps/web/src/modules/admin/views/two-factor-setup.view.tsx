import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, CopyIcon, DownloadIcon } from 'lucide-react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  TOTP_LENGTH,
  totpCodeSchema,
  type TwoFactorCodeError,
  type TwoFactorCodeValues,
} from '@/modules/auth/model/two-factor.schema'

import { BrandLogo } from '@/shared/ui/brand-logo'
import { Button } from '@/shared/ui/button'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'
import { SubmitButton } from '@/shared/ui/submit-button'

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

type VerifyCodeFormProps = {
  isVerifying: boolean
  invalidCode: boolean
  onVerify: (values: TwoFactorCodeValues) => void
}

function VerifyCodeForm({ isVerifying, invalidCode, onVerify }: VerifyCodeFormProps) {
  const { t } = useTranslation()
  const form = useForm<TwoFactorCodeValues>({ resolver: zodResolver(totpCodeSchema), defaultValues: { code: '' } })

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(onVerify)}>
      <Controller
        name="code"
        control={form.control}
        render={({ field, fieldState }) => {
          const invalid = fieldState.invalid || invalidCode
          const error =
            (fieldState.error?.message as TwoFactorCodeError | undefined) ??
            (invalidCode ? 'invalidTwoFactorCode' : undefined)
          return (
            <Field data-invalid={invalid}>
              <FieldLabel htmlFor="admin-totp">{t('admin.setup.verify')}</FieldLabel>
              <InputOTP
                id="admin-totp"
                ref={field.ref}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={TOTP_LENGTH}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoComplete="one-time-code"
                containerClassName="justify-center"
                aria-invalid={invalid}
              >
                <InputOTPGroup>
                  {Array.from({ length: TOTP_LENGTH }, (_, index) => (
                    <InputOTPSlot key={index} index={index} className="size-10 text-base" aria-invalid={invalid} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {error && <FieldError className="text-center">{t(`auth.errors.${error}`)}</FieldError>}
            </Field>
          )
        }}
      />
      <SubmitButton isSubmitting={isVerifying} label={t('admin.setup.verifyButton')} />
    </form>
  )
}

export { TwoFactorSetupView }
export type { TwoFactorSetupState, TwoFactorSetupViewProps }
