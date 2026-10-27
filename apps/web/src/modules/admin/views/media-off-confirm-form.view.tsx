import { zodResolver } from '@hookform/resolvers/zod'
import { MEDIA_NOTICE_AUDIENCES } from '@gameplay/contracts'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  mediaNoticeFormSchema,
  type MediaNoticeError,
  type MediaNoticeValues,
} from '@/modules/admin/model/media-notice.schema'
import { Button } from '@/shared/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

import type { MediaOffConfirmDialogViewProps } from './media-off-confirm-dialog.view'

type MediaOffConfirmFormProps = Omit<MediaOffConfirmDialogViewProps, 'open'>

function MediaOffConfirmForm({ resources, scope, impact, isSaving, onConfirm, onCancel }: MediaOffConfirmFormProps) {
  const { t } = useTranslation()
  const names = resources.map((resource) => t(`admin.media.resources.${resource}.name`)).join(', ')
  const form = useForm<MediaNoticeValues>({
    resolver: zodResolver(mediaNoticeFormSchema),
    defaultValues: {
      title: t('admin.media.confirm.defaultTitle', { resources: names }),
      message: t('admin.media.confirm.defaultMessage', { resources: names }),
      audience: 'affected',
    },
  })
  const titleError = form.formState.errors.title?.message as MediaNoticeError | undefined
  const messageError = form.formState.errors.message?.message as MediaNoticeError | undefined
  const audiences = MEDIA_NOTICE_AUDIENCES.filter((audience) => scope === 'server' || audience !== 'members')

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={form.handleSubmit((notice) => onConfirm(notice))}>
      <DialogHeader>
        <DialogTitle>{t('admin.media.confirm.title', { resources: names })}</DialogTitle>
        <DialogDescription>
          {impact === undefined
            ? '…'
            : impact === 0
              ? t('admin.media.confirm.impactNone')
              : t('admin.media.confirm.impact', { count: impact })}
        </DialogDescription>
      </DialogHeader>

      <Field data-invalid={Boolean(titleError)}>
        <FieldLabel htmlFor="media-notice-title">{t('admin.media.confirm.noticeTitle')}</FieldLabel>
        <Input {...form.register('title')} id="media-notice-title" aria-invalid={Boolean(titleError)} />
        {titleError && <FieldError>{t(`admin.announcements.errors.${titleError}`)}</FieldError>}
      </Field>
      <Field data-invalid={Boolean(messageError)}>
        <FieldLabel htmlFor="media-notice-message">{t('admin.media.confirm.noticeMessage')}</FieldLabel>
        <Textarea
          {...form.register('message')}
          id="media-notice-message"
          rows={3}
          aria-invalid={Boolean(messageError)}
        />
        {messageError && <FieldError>{t(`admin.announcements.errors.${messageError}`)}</FieldError>}
      </Field>
      <Field>
        <FieldLabel htmlFor="media-notice-audience">{t('admin.media.confirm.audience')}</FieldLabel>
        <Controller
          name="audience"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="media-notice-audience" className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((audience) => (
                  <SelectItem key={audience} value={audience}>
                    {t(`admin.media.confirm.audiences.${audience}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="button" variant="outline" disabled={isSaving} onClick={() => onConfirm()}>
          {t('admin.media.confirm.silent')}
        </Button>
        <Button type="submit" variant="destructive" disabled={isSaving}>
          {t('admin.media.confirm.notify')}
        </Button>
      </DialogFooter>
    </form>
  )
}

export { MediaOffConfirmForm }
export type { MediaOffConfirmFormProps }
