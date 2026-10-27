import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRightIcon, Loader2Icon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  inviteCodeSchema,
  type InviteCodeError,
  type InviteCodeInput,
  type InviteCodeValues,
} from '@/modules/invites/model/invite-code.schema'
import { useServerErrors } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { FieldError } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

import type { HubJoinError } from './hub.view'

type JoinByCodeFormProps = {
  defaultCode?: string
  isJoining: boolean
  joinError?: HubJoinError
  onJoin: (code: string) => void
}

function JoinByCodeForm({ defaultCode = '', isJoining, joinError, onJoin }: JoinByCodeFormProps) {
  const { t } = useTranslation()
  const form = useForm<InviteCodeInput, unknown, InviteCodeValues>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: { code: defaultCode },
    errors: useServerErrors<InviteCodeInput>(joinError ? { code: joinError } : undefined),
  })
  const code = useWatch({ control: form.control, name: 'code' })
  const error = form.formState.errors.code?.message as InviteCodeError | HubJoinError | undefined

  return (
    <form
      noValidate
      className="flex w-full flex-col gap-2"
      onSubmit={form.handleSubmit((values) => onJoin(values.code))}
    >
      <div className="flex gap-2">
        <Input
          {...form.register('code')}
          aria-label={t('hub.joinPlaceholder')}
          placeholder={t('hub.joinPlaceholder')}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          spellCheck={false}
          className="h-9 flex-1 font-semibold tracking-wide uppercase placeholder:font-normal placeholder:tracking-normal placeholder:normal-case"
        />
        <Button type="submit" variant="secondary" className="h-9" disabled={isJoining || !code.trim()}>
          {isJoining && <Loader2Icon className="animate-spin" aria-hidden />}
          {t('hub.join')}
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
      {error && <FieldError>{t(`hub.joinErrors.${error}`)}</FieldError>}
    </form>
  )
}

export { JoinByCodeForm }
export type { JoinByCodeFormProps }
