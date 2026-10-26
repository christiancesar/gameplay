import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { refreshSession, sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { mapChangePasswordError, mapUsernameError } from '@/modules/settings/model/mappers/profile-error.mapper'
import { validateAvatarFile } from '@/modules/settings/model/rules/validate-avatar-file'
import { changePassword, updateUsername } from '@/modules/settings/model/services/account-auth.service'
import { removeAvatar, uploadAvatar } from '@/modules/settings/model/services/account.service'
import type { ChangePasswordValues } from '@/modules/settings/model/profile.schema'
import type { ImageError } from '@/shared/lib/image-error'

type PasswordInput = Pick<ChangePasswordValues, 'currentPassword' | 'newPassword'>

/** Settings > Profile: avatar, username and password. The email is read only. */
function useProfileSettingsViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)
  const user = session?.user

  const [avatarError, setAvatarError] = useState<ImageError>()
  const [passwordChanged, setPasswordChanged] = useState(false)
  // Bumped after a password change so the Screen remounts the form and the fields clear.
  const [formKey, setFormKey] = useState(0)

  const unexpected = () => toast.error(t('settings.errors.unexpected'))

  const upload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => refreshSession(queryClient),
    onError: () => setAvatarError('uploadFailed'),
  })
  const remove = useMutation({
    mutationFn: removeAvatar,
    onSuccess: () => refreshSession(queryClient),
    onError: unexpected,
  })
  const username = useMutation({
    mutationFn: updateUsername,
    onSuccess: () => refreshSession(queryClient),
    onError: (error) => {
      if (mapUsernameError(error) === 'unexpected') unexpected()
    },
  })
  const password = useMutation({
    mutationFn: (input: PasswordInput) => changePassword(input),
    onMutate: () => setPasswordChanged(false),
    onSuccess: () => {
      setPasswordChanged(true)
      setFormKey((key) => key + 1)
    },
    onError: (error) => {
      if (mapChangePasswordError(error) === 'unexpected') unexpected()
    },
  })

  return {
    formKey,
    user: {
      name: user?.displayUsername ?? user?.username ?? user?.name ?? '',
      email: user?.email ?? '',
      avatarUrl: user?.image ?? undefined,
    },
    isUploadingAvatar: upload.isPending || remove.isPending,
    avatarError,
    onSelectAvatar: (file: File) => {
      const invalid = validateAvatarFile(file)
      setAvatarError(invalid)
      if (!invalid) upload.mutate(file)
    },
    onRemoveAvatar: () => {
      setAvatarError(undefined)
      remove.mutate()
    },
    isSavingUsername: username.isPending,
    usernameError:
      username.error && mapUsernameError(username.error) === 'usernameTaken' ? ('usernameTaken' as const) : undefined,
    onSaveUsername: (value: string) => username.mutate(value),
    isChangingPassword: password.isPending,
    passwordError:
      password.error && mapChangePasswordError(password.error) === 'invalidPassword'
        ? ('invalidPassword' as const)
        : undefined,
    passwordChanged,
    onChangePassword: (values: PasswordInput) => password.mutate(values),
  }
}

export { useProfileSettingsViewModel }
