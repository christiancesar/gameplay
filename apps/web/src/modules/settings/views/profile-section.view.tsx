import { useTranslation } from 'react-i18next'

import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/shared/ui/field'
import { ImagePicker, type ImageError } from '@/shared/ui/image-picker'
import { Input } from '@/shared/ui/input'

import { ChangePasswordForm, type ChangePasswordFormProps } from './change-password-form.view'
import { UsernameForm, type UsernameFormProps } from './username-form.view'

type ProfileSectionViewProps = {
  user: { name: string; email: string; avatarUrl?: string }
  isUploadingAvatar: boolean
  avatarError?: ImageError
  onSelectAvatar: (file: File) => void
  onRemoveAvatar: () => void
  isSavingUsername: boolean
  usernameError?: UsernameFormProps['error']
  onSaveUsername: UsernameFormProps['onSave']
  isChangingPassword: boolean
  passwordError?: ChangePasswordFormProps['error']
  passwordChanged: boolean
  onChangePassword: ChangePasswordFormProps['onSubmit']
}

/** Avatar, username e senha mudam aqui. O e-mail só pelo admin da plataforma. */
function ProfileSectionView({
  user,
  isUploadingAvatar,
  avatarError,
  onSelectAvatar,
  onRemoveAvatar,
  isSavingUsername,
  usernameError,
  onSaveUsername,
  isChangingPassword,
  passwordError,
  passwordChanged,
  onChangePassword,
}: ProfileSectionViewProps) {
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
      <UsernameForm username={user.name} isSaving={isSavingUsername} error={usernameError} onSave={onSaveUsername} />
      <Field>
        <FieldLabel htmlFor="profile-email">{t('settings.profile.email')}</FieldLabel>
        <Input id="profile-email" value={user.email} readOnly />
        <FieldDescription>{t('settings.profile.readOnly')}</FieldDescription>
      </Field>
      <FieldSeparator />
      <ChangePasswordForm
        isSaving={isChangingPassword}
        error={passwordError}
        changed={passwordChanged}
        onSubmit={onChangePassword}
      />
    </FieldGroup>
  )
}

export { ProfileSectionView }
export type { ProfileSectionViewProps }
