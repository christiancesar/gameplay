import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  createServerSchema,
  type CreateServerValues,
  type ServerNameError,
} from '@/modules/servers/model/server.schema'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { ImagePicker, type ImageError } from '@/shared/ui/image-picker'
import { Input } from '@/shared/ui/input'

/** Erros que só o servidor conhece. Os do nome vêm do schema. */
type CreateServerError = 'limitReached' | 'unexpected'

type CreateServerDialogViewProps = {
  open: boolean
  iconPreviewUrl?: string
  iconError?: ImageError
  formError?: CreateServerError
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSelectIcon: (file: File) => void
  onRemoveIcon: () => void
  /** Chamado só com dados que passaram no schema. */
  onSubmit: (values: CreateServerValues) => void
}

function CreateServerDialogView({ open, onOpenChange, ...props }: CreateServerDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* O form vive dentro do conteúdo do Dialog: fechar desmonta e limpa os campos. */}
        <CreateServerForm {...props} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

type CreateServerFormProps = Omit<CreateServerDialogViewProps, 'open' | 'onOpenChange'> & { onCancel: () => void }

function CreateServerForm({
  iconPreviewUrl,
  iconError,
  formError,
  isSubmitting,
  onSelectIcon,
  onRemoveIcon,
  onSubmit,
  onCancel,
}: CreateServerFormProps) {
  const { t } = useTranslation()
  const form = useForm<CreateServerValues>({
    resolver: zodResolver(createServerSchema),
    defaultValues: { name: '' },
  })
  const name = useWatch({ control: form.control, name: 'name' })

  return (
    <form noValidate className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
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
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-server-name">{t('createServer.name')}</FieldLabel>
              <Input
                {...field}
                id="create-server-name"
                autoFocus
                autoComplete="off"
                maxLength={60}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error?.message && (
                <FieldError>{t(`createServer.errors.${fieldState.error.message as ServerNameError}`)}</FieldError>
              )}
            </Field>
          )}
        />
        {formError && <FieldError>{t(`createServer.errors.${formError}`)}</FieldError>}
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <SubmitButton isSubmitting={isSubmitting} label={t('createServer.submit')} />
      </DialogFooter>
    </form>
  )
}

export { CreateServerDialogView }
export type { CreateServerDialogViewProps, CreateServerError }
