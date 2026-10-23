import { useTranslation } from 'react-i18next'

import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'

type GlobalLimitField = 'serversPerUser' | 'membersPerServer' | 'roomsPerServer'

type LimitsTabViewProps = {
  values: Record<GlobalLimitField, number>
  isDirty: boolean
  isSaving: boolean
  onChange: (field: GlobalLimitField, value: number) => void
  onSave: () => void
}

const FIELDS: GlobalLimitField[] = ['serversPerUser', 'membersPerServer', 'roomsPerServer']

function LimitsTabView({ values, isDirty, isSaving, onChange, onSave }: LimitsTabViewProps) {
  const { t } = useTranslation()

  return (
    <form
      noValidate
      className="flex max-w-md flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <FieldDescription>{t('admin.limits.description')}</FieldDescription>
      <FieldGroup>
        {FIELDS.map((field) => (
          <Field key={field} orientation="horizontal" className="justify-between">
            <FieldLabel htmlFor={`limit-${field}`}>{t(`admin.limits.${field}`)}</FieldLabel>
            <Input
              id={`limit-${field}`}
              type="number"
              min={1}
              className="w-24"
              value={values[field]}
              onChange={(event) => onChange(field, Math.max(1, Number(event.target.value)))}
            />
          </Field>
        ))}
      </FieldGroup>
      <div>
        <SubmitButton isSubmitting={isSaving} label={t('common.save')} disabled={!isDirty} />
      </div>
    </form>
  )
}

export { LimitsTabView }
export type { GlobalLimitField, LimitsTabViewProps }
