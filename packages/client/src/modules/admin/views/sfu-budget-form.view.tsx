import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { sfuBudgetSchema, type SfuBudgetValues } from '@/modules/admin/model/sfu-budget.schema'
import { Button } from '@/shared/ui/button'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

type SfuBudgetFormViewProps = {
  month: string
  /** O que conta para o orçamento: o maior entre o informado pelos espectadores e o número da Cloudflare. */
  usedBytes: number
  budgetGb: number
  isSaving: boolean
  onSave: (budgetGb: number) => void
}

const BYTES_PER_GB = 1_000_000_000

/** Consumo do SFU no mês contra o orçamento, e o campo para mudar o orçamento. */
function SfuBudgetFormView({ month, usedBytes, budgetGb, isSaving, onSave }: SfuBudgetFormViewProps) {
  const { t, i18n } = useTranslation()
  const form = useForm<SfuBudgetValues>({ resolver: zodResolver(sfuBudgetSchema), values: { budgetGb } })
  const usedGb = usedBytes / BYTES_PER_GB
  const share = budgetGb > 0 ? Math.min(1, usedGb / budgetGb) : 1
  const error = form.formState.errors.budgetGb?.message
  const format = (value: number) => value.toLocaleString(i18n.language, { maximumFractionDigits: 1 })

  return (
    <form
      noValidate
      className="mt-3 flex flex-col gap-2 border-t pt-3"
      onSubmit={form.handleSubmit((values) => onSave(values.budgetGb))}
    >
      <p className="text-xs">
        {t('admin.media.budget.usage', { used: format(usedGb), budget: format(budgetGb), month })}
      </p>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden>
        <div
          className={share >= 1 ? 'h-full bg-red-500' : share >= 0.8 ? 'h-full bg-amber-500' : 'h-full bg-emerald-500'}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <Field orientation="horizontal" className="items-end gap-2" data-invalid={Boolean(error)}>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="sfu-budget" className="text-xs font-normal">
            {t('admin.media.budget.label')}
          </FieldLabel>
          <Input
            {...form.register('budgetGb', { valueAsNumber: true })}
            id="sfu-budget"
            type="number"
            min={0}
            className="w-28"
            aria-invalid={Boolean(error)}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isSaving || !form.formState.isDirty}>
          {t('admin.media.budget.save')}
        </Button>
      </Field>
      {error && <FieldError>{t('admin.media.budget.errors.invalid')}</FieldError>}
    </form>
  )
}

export { SfuBudgetFormView }
export type { SfuBudgetFormViewProps }
