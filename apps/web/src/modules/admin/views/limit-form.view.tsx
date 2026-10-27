import { zodResolver } from '@hookform/resolvers/zod'
import { MEDIA_RESOURCES, type MediaResource } from '@gameplay/contracts'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { mediaChoiceSchema, type MediaChoice } from '@/modules/admin/model/media-choice.schema'
import {
  limitOverridesSchema,
  type LimitError,
  type LimitOverrides,
  type LimitOverridesInput,
} from '@/modules/admin/model/limits.schema'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SubmitButton } from '@/shared/ui/submit-button'

import type { LimitDialogViewProps } from './limit-dialog.view'

type LimitFormProps = Omit<LimitDialogViewProps, 'open' | 'onOpenChange'> & { onCancel: () => void }

function LimitForm({ title, fields, media, isSaving, onSave, onCancel }: LimitFormProps) {
  const { t } = useTranslation()
  const form = useForm<LimitOverridesInput, unknown, LimitOverrides>({
    resolver: zodResolver(limitOverridesSchema),
    defaultValues: Object.fromEntries(
      fields.map((field) => [
        field.id,
        { custom: field.override !== undefined, value: field.override ?? field.defaultValue },
      ]),
    ),
  })
  const values = useWatch({ control: form.control })
  const [mediaChoices, setMediaChoices] = useState<Record<MediaResource, MediaChoice>>(
    () => media?.choices ?? { sfu: 'global', mesh: 'global', turn: 'global' },
  )

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit((overrides) => onSave(overrides, media ? mediaChoices : undefined))}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      {fields.map((field) => {
        const custom = values[field.id]?.custom === true
        const error = form.formState.errors[field.id]?.value?.message as LimitError | undefined
        return (
          <Field key={field.id} data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={`${field.id}-value`}>{field.label}</FieldLabel>
            <div className="flex items-center gap-3">
              {custom ? (
                <Input
                  {...form.register(`${field.id}.value`, { valueAsNumber: true })}
                  id={`${field.id}-value`}
                  type="number"
                  min={0}
                  className="w-28"
                  aria-invalid={Boolean(error)}
                />
              ) : (
                // The global value, shown but not editable while the box is ticked.
                <Input id={`${field.id}-value`} type="number" value={field.defaultValue} disabled className="w-28" />
              )}
              <Controller
                name={`${field.id}.custom`}
                control={form.control}
                render={({ field: control }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${field.id}-global`}
                      checked={control.value !== true}
                      onCheckedChange={(checked) => control.onChange(checked !== true)}
                    />
                    <Label htmlFor={`${field.id}-global`} className="font-normal">
                      {t('admin.limitDialog.useDefault', { value: field.defaultValue })}
                    </Label>
                  </div>
                )}
              />
            </div>
            {error && <FieldError>{t(`admin.limits.errors.${error}`)}</FieldError>}
          </Field>
        )
      })}
      {media && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">{t('admin.media.title')}</legend>
          {MEDIA_RESOURCES.map((resource) => (
            <Field key={resource} orientation="horizontal" className="justify-between">
              <FieldLabel htmlFor={`media-${resource}`} className="font-normal">
                {t(`admin.media.resources.${resource}.name`)}
              </FieldLabel>
              <Select
                value={mediaChoices[resource]}
                onValueChange={(value) =>
                  setMediaChoices((current) => ({ ...current, [resource]: value as MediaChoice }))
                }
              >
                <SelectTrigger id={`media-${resource}`} className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mediaChoiceSchema.options.map((choice) => (
                    <SelectItem key={choice} value={choice}>
                      {choice === 'global'
                        ? t('admin.media.choices.global', {
                            state: t(media.globals[resource] ? 'admin.media.on' : 'admin.media.off'),
                          })
                        : t(`admin.media.choices.${choice}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ))}
        </fieldset>
      )}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <SubmitButton isSubmitting={isSaving} label={t('admin.limitDialog.save')} />
      </DialogFooter>
    </form>
  )
}

export { LimitForm }
export type { LimitFormProps }
