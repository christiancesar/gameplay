import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { AuthLayoutView, type AuthLayoutViewProps } from '@/modules/auth/views/auth-layout.view'
import { serverAddressSchema, type ServerAddressValues } from '@/modules/server-choice/model/server-address.schema'
import { useServerErrors } from '@/shared/lib/form'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'

type ServerChoiceViewProps = Omit<AuthLayoutViewProps, 'children'> & {
  /** O servidor escolhido antes, se houver. */
  defaultValue?: string
  isChecking: boolean
  /** O que o servidor respondeu: não é um endereço, não atendeu, ou não é um Gameplay. */
  error?: 'invalid' | 'unreachable' | 'notGameplay'
  /** Chamado só com um endereço que passou no schema. */
  onSubmit: (address: string) => void
}

/** Primeira tela do app desktop: de qual servidor Gameplay a conta é. */
function ServerChoiceView({ defaultValue = '', isChecking, error, onSubmit, ...layout }: ServerChoiceViewProps) {
  const { t } = useTranslation()
  const form = useForm<ServerAddressValues>({
    resolver: zodResolver(serverAddressSchema),
    defaultValues: { address: defaultValue },
    errors: useServerErrors<ServerAddressValues>({ address: error }),
  })

  return (
    <AuthLayoutView {...layout}>
      <form
        noValidate
        className="bg-card text-card-foreground flex flex-col gap-6 rounded-lg border p-6"
        onSubmit={form.handleSubmit((values) => onSubmit(values.address))}
      >
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-medium">{t('serverChoice.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('serverChoice.description')}</p>
        </div>
        <FieldGroup>
          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="server-address">{t('serverChoice.label')}</FieldLabel>
                <Input
                  {...field}
                  id="server-address"
                  inputMode="url"
                  autoComplete="url"
                  autoFocus
                  placeholder={t('serverChoice.placeholder')}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error?.message ? (
                  <FieldError>
                    {t(`serverChoice.errors.${fieldState.error.message as 'required' | 'invalid'}`)}
                  </FieldError>
                ) : (
                  <FieldDescription>{t('serverChoice.hint')}</FieldDescription>
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <SubmitButton isSubmitting={isChecking} label={t('serverChoice.submit')} />
      </form>
    </AuthLayoutView>
  )
}

export { ServerChoiceView }
export type { ServerChoiceViewProps }
