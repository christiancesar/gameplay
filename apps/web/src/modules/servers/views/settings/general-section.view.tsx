import { useTranslation } from 'react-i18next'

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { ImagePicker, type ImageError } from '@/shared/ui/image-picker'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'

type GeneralField = 'name' | 'description'

type GeneralSectionViewProps = {
  values: { name: string; description: string; autoApprove: boolean }
  iconUrl?: string
  coverUrl?: string
  nameError?: 'nameRequired' | 'nameTooLong'
  iconError?: ImageError
  coverError?: ImageError
  uploading: { icon: boolean; cover: boolean }
  isDirty: boolean
  isSaving: boolean
  onChange: (field: GeneralField, value: string) => void
  onAutoApproveChange: (value: boolean) => void
  onSelectIcon: (file: File) => void
  onRemoveIcon: () => void
  onSelectCover: (file: File) => void
  onRemoveCover: () => void
  onSave: () => void
}

function GeneralSectionView({
  values,
  iconUrl,
  coverUrl,
  nameError,
  iconError,
  coverError,
  uploading,
  isDirty,
  isSaving,
  onChange,
  onAutoApproveChange,
  onSelectIcon,
  onRemoveIcon,
  onSelectCover,
  onRemoveCover,
  onSave,
}: GeneralSectionViewProps) {
  const { t } = useTranslation()
  const imageLabels = { choose: t('image.choose'), change: t('image.change'), remove: t('image.remove') }

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>{t('serverSettings.general.icon')}</FieldLabel>
          <ImagePicker
            name={values.name}
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
        <Field data-invalid={Boolean(nameError)}>
          <FieldLabel htmlFor="server-name">{t('serverSettings.general.name')}</FieldLabel>
          <Input
            id="server-name"
            value={values.name}
            maxLength={60}
            aria-invalid={Boolean(nameError)}
            onChange={(event) => onChange('name', event.target.value)}
          />
          {nameError && <FieldError>{t(`createServer.errors.${nameError}`)}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="server-description">{t('serverSettings.general.description')}</FieldLabel>
          <Textarea
            id="server-description"
            rows={3}
            maxLength={280}
            value={values.description}
            onChange={(event) => onChange('description', event.target.value)}
          />
        </Field>
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
        <Field orientation="horizontal" className="justify-between gap-6">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="server-auto-approve">{t('serverSettings.general.autoApprove')}</FieldLabel>
            <FieldDescription>{t('serverSettings.general.autoApproveHint')}</FieldDescription>
          </div>
          <Switch id="server-auto-approve" checked={values.autoApprove} onCheckedChange={onAutoApproveChange} />
        </Field>
      </FieldGroup>
      <div className="flex justify-end">
        <SubmitButton isSubmitting={isSaving} label={t('common.save')} disabled={!isDirty} />
      </div>
    </form>
  )
}

export { GeneralSectionView }
export type { GeneralField, GeneralSectionViewProps }
