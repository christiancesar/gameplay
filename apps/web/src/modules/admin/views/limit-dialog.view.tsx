import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { limitOverridesSchema, type LimitError, type LimitOverrides, type LimitOverridesInput } from '@/modules/admin/model/limits.schema'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Switch } from '@/shared/ui/switch'

type LimitField = {
  id: string
  label: string
  defaultValue: number
  /** undefined = usa o padrão global. */
  override?: number
}

type LimitDialogViewProps = {
  open: boolean
  title: string
  fields: readonly LimitField[]
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  /** Por id do limite: número escolhido, ou undefined para voltar ao padrão global. */
  onSave: (overrides: LimitOverrides) => void
}

/** Override de limites por usuário ou por servidor (2.2). */
function LimitDialogView({ open, onOpenChange, ...props }: LimitDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* O form vive dentro do conteúdo do Dialog: reabrir começa dos valores salvos. */}
        <LimitForm {...props} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

type LimitFormProps = Omit<LimitDialogViewProps, 'open' | 'onOpenChange'> & { onCancel: () => void }

function LimitForm({ title, fields, isSaving, onSave, onCancel }: LimitFormProps) {
  const { t } = useTranslation()
  const form = useForm<LimitOverridesInput, unknown, LimitOverrides>({
    resolver: zodResolver(limitOverridesSchema),
    defaultValues: Object.fromEntries(
      fields.map((field) => [field.id, { custom: field.override !== undefined, value: field.override ?? field.defaultValue }]),
    ),
  })
  const values = useWatch({ control: form.control })

  return (
    <form noValidate className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSave)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      {fields.map((field) => {
        const custom = values[field.id]?.custom === true
        const error = form.formState.errors[field.id]?.value?.message as LimitError | undefined
        return (
          <fieldset key={field.id} className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium">{field.label}</legend>
            <div className="flex items-center gap-2">
              <Controller
                name={`${field.id}.custom`}
                control={form.control}
                render={({ field: control }) => (
                  <Switch id={`${field.id}-custom`} checked={control.value === true} onCheckedChange={control.onChange} />
                )}
              />
              <Label htmlFor={`${field.id}-custom`} className="font-normal">
                {custom ? t('admin.limitDialog.override') : t('admin.limitDialog.useDefault', { value: field.defaultValue })}
              </Label>
            </div>
            {custom && (
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor={`${field.id}-value`} className="sr-only">
                  {field.label}
                </FieldLabel>
                <Input
                  {...form.register(`${field.id}.value`, { valueAsNumber: true })}
                  id={`${field.id}-value`}
                  type="number"
                  min={0}
                  className="w-28"
                  aria-invalid={Boolean(error)}
                />
                {error && <FieldError>{t(`admin.limits.errors.${error}`)}</FieldError>}
              </Field>
            )}
          </fieldset>
        )
      })}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <SubmitButton isSubmitting={isSaving} label={t('admin.limitDialog.save')} />
      </DialogFooter>
    </form>
  )
}

export { LimitDialogView }
export type { LimitDialogViewProps, LimitField }
