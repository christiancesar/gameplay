import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRightIcon, LayoutGridIcon, Loader2Icon, SettingsIcon, ShieldUserIcon, TicketIcon, UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  inviteCodeSchema,
  type InviteCodeError,
  type InviteCodeInput,
  type InviteCodeValues,
} from '@/modules/invites/model/invite-code.schema'
import { useServerErrors } from '@/shared/lib/form'

import { BrandLogo } from '@/shared/ui/brand-logo'
import { Button } from '@/shared/ui/button'
import { FieldError } from '@/shared/ui/field'
import { IconButton } from '@/shared/ui/icon-button'
import { Input } from '@/shared/ui/input'
import { LanguageSwitcher, type LanguageOption } from '@/shared/ui/language-switcher'
import { SectionLabel } from '@/shared/ui/section-label'
import { Separator } from '@/shared/ui/separator'
import { ServerIcon } from '@/shared/ui/server-icon'
import { Skeleton } from '@/shared/ui/skeleton'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
import { UserAvatar } from '@/shared/ui/user-avatar'

type HubUser = {
  name: string
  email: string
  avatarUrl?: string
}

type HubServer = {
  id: string
  name: string
  iconUrl?: string
}

type HubJoinError =
  | 'inviteNotFound'
  | 'inviteExpired'
  | 'inviteExhausted'
  | 'serverFull'
  | 'alreadyMember'
  | 'unexpected'

type HubViewProps = {
  /** Painel de notificações: à direita em telas grandes, separado por um divisor; acima do conteúdo nas pequenas. */
  notifications?: ReactNode
  user: HubUser
  isPlatformAdmin: boolean
  servers: readonly HubServer[]
  isLoadingServers: boolean
  canCreateServer: boolean
  /** Código já preenchido (ex.: veio de um link). */
  defaultJoinCode?: string
  isJoining: boolean
  /** Erro do servidor ao entrar; some quando o usuário edita o código. */
  joinError?: HubJoinError
  theme: 'dark' | 'light'
  language: string
  languageOptions: readonly LanguageOption[]
  onOpenServer: (serverId: string) => void
  onCreateServer: () => void
  /** Chamado só com um código que passou no schema (sem espaços, em maiúsculas). */
  onJoin: (code: string) => void
  onOpenAdmin: () => void
  onOpenSettings: () => void
  onToggleTheme: () => void
  onLanguageChange: (language: string) => void
}

function HubView({
  notifications,
  user,
  isPlatformAdmin,
  servers,
  isLoadingServers,
  canCreateServer,
  defaultJoinCode,
  isJoining,
  joinError,
  theme,
  language,
  languageOptions,
  onOpenServer,
  onCreateServer,
  onJoin,
  onOpenAdmin,
  onOpenSettings,
  onToggleTheme,
  onLanguageChange,
}: HubViewProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <BrandLogo variant="unlimited" className="w-48" />

      {/* Conteúdo e notificações formam um bloco único centralizado; em telas pequenas as notificações vêm primeiro. */}
      <div className="mt-12 flex w-full max-w-sm flex-col gap-8 lg:w-auto lg:max-w-none lg:flex-row lg:items-stretch lg:gap-10">
        <div className="flex w-full flex-col gap-8 lg:w-96">
          <section aria-labelledby="hub-profile" className="flex flex-col gap-2">
            <SectionLabel id="hub-profile" icon={UserIcon}>
              {t('hub.profile')}
            </SectionLabel>
            <div className="bg-card text-card-foreground flex w-full items-center gap-3 rounded-md border px-4 py-3">
              <UserAvatar name={user.name} imageUrl={user.avatarUrl} size="xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1">
              {isPlatformAdmin && <IconButton label={t('common.adminPanel')} icon={<ShieldUserIcon />} onClick={onOpenAdmin} />}
              <IconButton label={t('common.settings')} icon={<SettingsIcon />} onClick={onOpenSettings} />
              <ThemeToggle
                theme={theme}
                onToggle={onToggleTheme}
                labels={{ toLight: t('common.theme.toLight'), toDark: t('common.theme.toDark') }}
              />
              <LanguageSwitcher
                className="ml-2"
                value={language}
                options={languageOptions}
                onChange={onLanguageChange}
                ariaLabel={t('common.language')}
              />
            </div>
          </section>

          <section aria-labelledby="hub-servers" className="flex flex-col gap-2">
            <SectionLabel id="hub-servers" icon={LayoutGridIcon} count={isLoadingServers ? undefined : servers.length}>
              {t('hub.servers')}
            </SectionLabel>
            <div className="flex w-full flex-wrap gap-2.5">
              <ul aria-label={t('hub.servers')} className="contents">
                {isLoadingServers
                  ? Array.from({ length: 2 }, (_, index) => (
                      <li key={index}>
                        <Skeleton className="bg-card size-20 rounded-md" />
                      </li>
                    ))
                  : servers.map((server) => (
                      <li key={server.id}>
                        <button
                          type="button"
                          onClick={() => onOpenServer(server.id)}
                          className="bg-card text-card-foreground hover:bg-accent focus-visible:ring-ring/50 flex size-20 flex-col items-center justify-center gap-1.5 rounded-md border px-1 text-xs font-medium outline-none focus-visible:ring-3"
                        >
                          <ServerIcon name={server.name} imageUrl={server.iconUrl} className="size-9 rounded-md text-xs" />
                          <span className="w-full truncate text-center">{server.name}</span>
                        </button>
                      </li>
                    ))}
              </ul>

              <button
                type="button"
                onClick={onCreateServer}
                disabled={!canCreateServer}
                className="bg-card text-card-foreground hover:bg-accent focus-visible:ring-ring/50 flex h-20 min-w-0 flex-1 basis-56 items-center gap-3 rounded-md border px-4 text-left outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t('hub.createServer')}</span>
                  <span className="text-muted-foreground line-clamp-2 text-xs leading-snug">
                    {canCreateServer ? t('hub.createServerDescription') : t('hub.createServerLimitDescription')}
                  </span>
                </span>
                {canCreateServer ? (
                  <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-sm">
                    <ChevronRightIcon className="size-4" />
                  </span>
                ) : (
                  <span className="bg-muted shrink-0 rounded-sm px-2 py-0.5 text-[11px]">{t('hub.createServerLimit')}</span>
                )}
              </button>
            </div>
          </section>

          <section aria-labelledby="hub-join" className="flex flex-col gap-2">
            <SectionLabel id="hub-join" icon={TicketIcon}>
              {t('hub.joinTitle')}
            </SectionLabel>
            <JoinByCodeForm defaultCode={defaultJoinCode} isJoining={isJoining} joinError={joinError} onJoin={onJoin} />
          </section>
        </div>

        {notifications && (
          <>
            <Separator orientation="vertical" className="hidden lg:block" />
            <aside className="order-first w-full lg:order-none lg:w-80">{notifications}</aside>
          </>
        )}
      </div>
    </div>
  )
}

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
    <form noValidate className="flex w-full flex-col gap-2" onSubmit={form.handleSubmit((values) => onJoin(values.code))}>
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

export { HubView }
export type { HubJoinError, HubServer, HubUser, HubViewProps }
