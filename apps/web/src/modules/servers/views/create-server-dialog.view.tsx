import { useTranslation } from 'react-i18next'

import { SubmitButton } from '@/shared/ui/submit-button'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { ImagePicker } from '@/shared/ui/image-picker'
import { Input } from '@/shared/ui/input'

type ImageError = 'tooLarge' | 'invalidType' | 'uploadFailed'
type CreateServerError = 'nameRequired' | 'nameTooLong' | 'limitReached' | 'unexpected'

type CreateServerDialogViewProps = {
  open: boolean
  name: string
  iconPreviewUrl?: string
  nameError?: Extract<CreateServerError, 'nameRequired' | 'nameTooLong'>
  iconError?: ImageError
  formError?: Extract<CreateServerError, 'limitReached' | 'unexpected'>
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onNameChange: (name: string) => void
  onSelectIcon: (file: File) => void
  onRemoveIcon: () => void
  onSubmit: () => void
}

function CreateServerDialogView({
  open,
  name,
  iconPreviewUrl,
  nameError,
  iconError,
  formError,
  isSubmitting,
  onOpenChange,
  onNameChange,
  onSelectIcon,
  onRemoveIcon,
  onSubmit,
}: CreateServerDialogViewProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('createServer.title')}</DialogTitle>
            <DialogDescription>{t('createServer.description')}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>{t('createServer.icon')}</FieldLabel>
              <ImagePicker
                name={name}
                previewUrl={iconPreviewUrl}
                shape="square"
                error={iconError ? t(`image.errors.${iconError}`) : undefined}
                hint={t('image.hint')}
                labels={{ choose: t('image.choose'), change: t('image.change'), remove: t('image.remove') }}
                onSelectFile={onSelectIcon}
                onRemove={onRemoveIcon}
              />
            </Field>
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="create-server-name">{t('createServer.name')}</FieldLabel>
              <Input
                id="create-server-name"
                autoFocus
                autoComplete="off"
                maxLength={60}
                value={name}
                aria-invalid={Boolean(nameError)}
                onChange={(event) => onNameChange(event.target.value)}
              />
              {nameError && <FieldError>{t(`createServer.errors.${nameError}`)}</FieldError>}
            </Field>
            {formError && <FieldError>{t(`createServer.errors.${formError}`)}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <SubmitButton isSubmitting={isSubmitting} label={t('createServer.submit')} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateServerDialogView }
export type { CreateServerDialogViewProps, CreateServerError, ImageError }
