import { zodResolver } from '@hookform/resolvers/zod'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  TOTP_LENGTH,
  totpCodeSchema,
  type TwoFactorCodeError,
  type TwoFactorCodeValues,
} from '@/modules/auth/model/two-factor.schema'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'
import { SubmitButton } from '@/shared/ui/submit-button'

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

export { VerifyCodeForm }
export type { VerifyCodeFormProps }
