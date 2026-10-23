import { useTranslation } from 'react-i18next'

import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { ImagePicker, type ImageError } from '@/shared/ui/image-picker'
import { Input } from '@/shared/ui/input'

type ProfileSectionViewProps = {
  user: { name: string; email: string; avatarUrl?: string }
  isUploadingAvatar: boolean
  avatarError?: ImageError
  onSelectAvatar: (file: File) => void
  onRemoveAvatar: () => void
}

function ProfileSectionView({ user, isUploadingAvatar, avatarError, onSelectAvatar, onRemoveAvatar }: ProfileSectionViewProps) {
  const { t } = useTranslation()

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{t('settings.profile.avatar')}</FieldLabel>
        <ImagePicker
          name={user.name}
          previewUrl={user.avatarUrl}
          shape="circle"
          isUploading={isUploadingAvatar}
          error={avatarError ? t(`image.errors.${avatarError}`) : undefined}
          hint={t('image.hint')}
          labels={{ choose: t('image.choose'), change: t('image.change'), remove: t('image.remove') }}
          onSelectFile={onSelectAvatar}
          onRemove={onRemoveAvatar}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="profile-username">{t('settings.profile.username')}</FieldLabel>
        <Input id="profile-username" value={user.name} readOnly />
      </Field>
      <Field>
        <FieldLabel htmlFor="profile-email">{t('settings.profile.email')}</FieldLabel>
        <Input id="profile-email" value={user.email} readOnly />
        <FieldDescription>{t('settings.profile.readOnly')}</FieldDescription>
      </Field>
    </FieldGroup>
  )
}

export { ProfileSectionView }
export type { ProfileSectionViewProps }
