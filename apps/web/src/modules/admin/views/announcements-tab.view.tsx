import { zodResolver } from '@hookform/resolvers/zod'
import { ANNOUNCEMENT_MESSAGE_MAX, ANNOUNCEMENT_TITLE_MAX } from '@gameplay/contracts'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  ANNOUNCEMENT_AUDIENCES,
  announcementSchema,
  type AnnouncementAudienceOption,
  type AnnouncementError,
  type AnnouncementValues,
} from '@/modules/admin/model/announcement.schema'
import type { AnnouncementServerOption } from '@/modules/admin/model/entities/announcement-server-option'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Textarea } from '@/shared/ui/textarea'

type AnnouncementsTabViewProps = {
  servers: readonly AnnouncementServerOption[]
  isSending: boolean
  onSend: (values: AnnouncementValues) => void
}

const EMPTY: AnnouncementValues = { title: '', message: '', audience: 'everyone', serverId: '' }

/** Aviso da plataforma: vai para o sino do Hub de cada pessoa e aparece na hora para quem está online. */
function AnnouncementsTabView({ servers, isSending, onSend }: AnnouncementsTabViewProps) {
  const { t } = useTranslation()
  const form = useForm<AnnouncementValues>({ resolver: zodResolver(announcementSchema), defaultValues: EMPTY })
  const [audience, message] = useWatch({ control: form.control, name: ['audience', 'message'] })
  const { errors } = form.formState
  const titleError = errors.title?.message as AnnouncementError | undefined
  const messageError = errors.message?.message as AnnouncementError | undefined
  const serverError = errors.serverId?.message as AnnouncementError | undefined

  return (
    <form noValidate className="flex max-w-xl flex-col gap-5" onSubmit={form.handleSubmit(onSend)}>
      <p className="text-muted-foreground text-sm">{t('admin.announcements.description')}</p>

      <Field data-invalid={Boolean(titleError)}>
        <FieldLabel htmlFor="announcement-title">{t('admin.announcements.titleLabel')}</FieldLabel>
        <Input
          {...form.register('title')}
          id="announcement-title"
          maxLength={ANNOUNCEMENT_TITLE_MAX}
          aria-invalid={Boolean(titleError)}
        />
        {titleError && <FieldError>{t(`admin.announcements.errors.${titleError}`)}</FieldError>}
      </Field>

      <Field data-invalid={Boolean(messageError)}>
        <FieldLabel htmlFor="announcement-message">{t('admin.announcements.messageLabel')}</FieldLabel>
        <Textarea
          {...form.register('message')}
          id="announcement-message"
          rows={4}
          maxLength={ANNOUNCEMENT_MESSAGE_MAX}
          aria-invalid={Boolean(messageError)}
        />
        <FieldDescription>
          {t('admin.announcements.remaining', { count: ANNOUNCEMENT_MESSAGE_MAX - message.length })}
        </FieldDescription>
        {messageError && <FieldError>{t(`admin.announcements.errors.${messageError}`)}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="announcement-audience">{t('admin.announcements.audience')}</FieldLabel>
        <Controller
          name="audience"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => field.onChange(value as AnnouncementAudienceOption)}>
              <SelectTrigger id="announcement-audience" className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANNOUNCEMENT_AUDIENCES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.announcements.audiences.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      {audience === 'server' && (
        <Field data-invalid={Boolean(serverError)}>
          <FieldLabel htmlFor="announcement-server">{t('admin.announcements.server')}</FieldLabel>
          <Controller
            name="serverId"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="announcement-server" className="w-64" aria-invalid={Boolean(serverError)}>
                  <SelectValue placeholder={t('admin.announcements.serverPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {serverError && <FieldError>{t(`admin.announcements.errors.${serverError}`)}</FieldError>}
        </Field>
      )}

      <div>
        <SubmitButton isSubmitting={isSending} label={t('admin.announcements.send')} />
      </div>
    </form>
  )
}

export { AnnouncementsTabView }
export type { AnnouncementsTabViewProps }
