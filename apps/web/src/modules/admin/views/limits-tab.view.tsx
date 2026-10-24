import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  globalLimitsSchema,
  type GlobalLimitField,
  type GlobalLimits,
  type LimitError,
} from '@/modules/admin/model/limits.schema'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'

type LimitsTabViewProps = {
  /** Valores salvos. Quando mudam (depois de salvar), o form volta a ficar sem alterações. */
  values: GlobalLimits
  isSaving: boolean
  /** Chamado só com dados que passaram no schema. */
  onSave: (values: GlobalLimits) => void
}

const FIELDS: GlobalLimitField[] = ['serversPerUser', 'membersPerServer', 'roomsPerServer']

function LimitsTabView({ values, isSaving, onSave }: LimitsTabViewProps) {
  const { t } = useTranslation()
  const form = useForm<GlobalLimits>({ resolver: zodResolver(globalLimitsSchema), values })

  return (
    <form noValidate className="flex max-w-md flex-col gap-6" onSubmit={form.handleSubmit(onSave)}>
      <FieldDescription>{t('admin.limits.description')}</FieldDescription>
      <FieldGroup>
        {FIELDS.map((field) => {
          const error = form.formState.errors[field]?.message as LimitError | undefined
          return (
            <div key={field} className="flex flex-col gap-2">
              <Field orientation="horizontal" className="justify-between" data-invalid={Boolean(error)}>
                <FieldLabel htmlFor={`limit-${field}`}>{t(`admin.limits.${field}`)}</FieldLabel>
                <Input
                  {...form.register(field, { valueAsNumber: true })}
                  id={`limit-${field}`}
                  type="number"
                  min={1}
                  className="w-24"
                  aria-invalid={Boolean(error)}
                />
              </Field>
              {error && <FieldError className="text-right">{t(`admin.limits.errors.${error}`)}</FieldError>}
            </div>
          )
        })}
      </FieldGroup>
      <div>
        <SubmitButton isSubmitting={isSaving} label={t('common.save')} disabled={!form.formState.isDirty} />
      </div>
    </form>
  )
}

export { LimitsTabView }
export type { LimitsTabViewProps }
