import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldLabel } from '@/shared/ui/field'
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
  onOverrideChange: (fieldId: string, value: number | undefined) => void
  onSave: () => void
}

/** Override de limites por usuário ou por servidor (2.2). */
function LimitDialogView({ open, title, fields, isSaving, onOpenChange, onOverrideChange, onSave }: LimitDialogViewProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            onSave()
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {fields.map((field) => {
            const custom = field.override !== undefined
            return (
              <fieldset key={field.id} className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-medium">{field.label}</legend>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`${field.id}-custom`}
                    checked={custom}
                    onCheckedChange={(checked) => onOverrideChange(field.id, checked ? field.defaultValue : undefined)}
                  />
                  <Label htmlFor={`${field.id}-custom`} className="font-normal">
                    {custom ? t('admin.limitDialog.override') : t('admin.limitDialog.useDefault', { value: field.defaultValue })}
                  </Label>
                </div>
                {custom && (
                  <Field>
                    <FieldLabel htmlFor={`${field.id}-value`} className="sr-only">
                      {field.label}
                    </FieldLabel>
                    <Input
                      id={`${field.id}-value`}
                      type="number"
                      min={0}
                      className="w-28"
                      value={field.override}
                      onChange={(event) => onOverrideChange(field.id, Math.max(0, Number(event.target.value)))}
                    />
                  </Field>
                )}
              </fieldset>
            )
          })}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <SubmitButton isSubmitting={isSaving} label={t('admin.limitDialog.save')} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { LimitDialogView }
export type { LimitDialogViewProps, LimitField }
