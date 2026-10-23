import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  SERVER_DESCRIPTION_MAX,
  serverGeneralSchema,
  type ServerGeneralValues,
  type ServerNameError,
} from '@/modules/servers/model/server.schema'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { ImagePicker, type ImageError } from '@/shared/ui/image-picker'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Textarea } from '@/shared/ui/textarea'

type GeneralSectionViewProps = {
  /** Valores salvos. Quando mudam (depois de salvar), o form volta a ficar sem alterações. */
  values: ServerGeneralValues
  iconUrl?: string
  coverUrl?: string
  iconError?: ImageError
  coverError?: ImageError
  uploading: { icon: boolean; cover: boolean }
  isSaving: boolean
  onSelectIcon: (file: File) => void
  onRemoveIcon: () => void
  onSelectCover: (file: File) => void
  onRemoveCover: () => void
  /** Chamado só com dados que passaram no schema. */
  onSave: (values: ServerGeneralValues) => void
}

function GeneralSectionView({
  values,
  iconUrl,
  coverUrl,
  iconError,
  coverError,
  uploading,
  isSaving,
  onSelectIcon,
  onRemoveIcon,
  onSelectCover,
  onRemoveCover,
  onSave,
}: GeneralSectionViewProps) {
  const { t } = useTranslation()
  const imageLabels = { choose: t('image.choose'), change: t('image.change'), remove: t('image.remove') }
  const form = useForm<ServerGeneralValues>({ resolver: zodResolver(serverGeneralSchema), values })
  const name = useWatch({ control: form.control, name: 'name' })

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(onSave)}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>{t('serverSettings.general.icon')}</FieldLabel>
          <ImagePicker
            name={name}
            previewUrl={iconUrl}
            shape="square"
            isUploading={uploading.icon}
            error={iconError ? t(`image.errors.${iconError}`) : undefined}
            hint={t('image.hint')}
            labels={imageLabels}
            onSelectFile={onSelectIcon}
            onRemove={onRemoveIcon}
          />
        </Field>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="server-name">{t('serverSettings.general.name')}</FieldLabel>
              <Input {...field} id="server-name" maxLength={60} aria-invalid={fieldState.invalid} />
              {fieldState.error?.message && (
                <FieldError>{t(`createServer.errors.${fieldState.error.message as ServerNameError}`)}</FieldError>
              )}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="server-description">{t('serverSettings.general.description')}</FieldLabel>
              <Textarea {...field} id="server-description" rows={3} maxLength={SERVER_DESCRIPTION_MAX} />
            </Field>
          )}
        />
        <Field>
          <FieldLabel>{t('serverSettings.general.cover')}</FieldLabel>
          <ImagePicker
            previewUrl={coverUrl}
            shape="cover"
            isUploading={uploading.cover}
            error={coverError ? t(`image.errors.${coverError}`) : undefined}
            hint={`${t('serverSettings.general.coverHint')} ${t('image.hint')}`}
            labels={imageLabels}
            onSelectFile={onSelectCover}
            onRemove={onRemoveCover}
          />
        </Field>
      </FieldGroup>
      <div className="flex justify-end">
        <SubmitButton isSubmitting={isSaving} label={t('common.save')} disabled={!form.formState.isDirty} />
      </div>
    </form>
  )
}

export { GeneralSectionView }
export type { GeneralSectionViewProps }
