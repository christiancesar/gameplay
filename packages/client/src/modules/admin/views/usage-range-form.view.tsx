import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { usageRangeSchema, type UsageRangeValues } from '@/modules/admin/model/usage-range.schema'
import { useServerErrors } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

type UsageRangeFormViewProps = {
  range: UsageRangeValues
  /** Dias (UTC) que a Cloudflare ainda guarda. */
  limits: { min: string; max: string }
  /** O servidor recusou o período (fora dos últimos 30 dias). */
  rangeError?: 'outOfRange'
  isFetching: boolean
  onApply: (range: UsageRangeValues) => void
}

/** Período personalizado do consumo: de um dia a outro, dentro dos últimos 30 dias. */
function UsageRangeFormView({ range, limits, rangeError, isFetching, onApply }: UsageRangeFormViewProps) {
  const { t } = useTranslation()
  const errors = useServerErrors<UsageRangeValues>({ to: rangeError })
  const form = useForm<UsageRangeValues>({ resolver: zodResolver(usageRangeSchema), values: range, errors })
  const error = (form.formState.errors.from?.message ?? form.formState.errors.to?.message) as
    | 'required'
    | 'order'
    | 'outOfRange'
    | undefined

  return (
    <form noValidate className="flex flex-col gap-2" onSubmit={form.handleSubmit((values) => onApply(values))}>
      <div className="flex flex-wrap items-end gap-2">
        {(['from', 'to'] as const).map((name) => (
          <Field key={name} className="w-auto gap-1" data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={`usage-range-${name}`} className="text-xs font-normal">
              {t(`admin.media.usage.range.${name}`)}
            </FieldLabel>
            <Input
              {...form.register(name)}
              id={`usage-range-${name}`}
              type="date"
              min={limits.min}
              max={limits.max}
              className="w-40"
              aria-invalid={Boolean(error)}
            />
          </Field>
        ))}
        <Button type="submit" variant="outline" size="sm" disabled={isFetching}>
          {t('admin.media.usage.range.apply')}
        </Button>
      </div>
      {error ? (
        <FieldError>{t(`admin.media.usage.range.errors.${error}`)}</FieldError>
      ) : (
        <FieldDescription className="text-xs">{t('admin.media.usage.range.hint')}</FieldDescription>
      )}
    </form>
  )
}

export { UsageRangeFormView }
export type { UsageRangeFormViewProps }
