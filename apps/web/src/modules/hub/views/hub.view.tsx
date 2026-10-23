import { ChevronRightIcon, Loader2Icon, SettingsIcon, ShieldUserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { BrandLogo } from '@/shared/ui/brand-logo'
import { Button } from '@/shared/ui/button'
import { FieldError } from '@/shared/ui/field'
import { IconButton } from '@/shared/ui/icon-button'
import { Input } from '@/shared/ui/input'
import { LanguageSwitcher, type LanguageOption } from '@/shared/ui/language-switcher'
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
  /** Aviso opcional abaixo do perfil (ex.: permissão de hardware). */
  banner?: ReactNode
  user: HubUser
  isPlatformAdmin: boolean
  servers: readonly HubServer[]
  isLoadingServers: boolean
  canCreateServer: boolean
  joinCode: string
  isJoining: boolean
  joinError?: HubJoinError
  theme: 'dark' | 'light'
  language: string
  languageOptions: readonly LanguageOption[]
  onOpenServer: (serverId: string) => void
  onCreateServer: () => void
  onJoinCodeChange: (value: string) => void
  onJoin: () => void
  onOpenAdmin: () => void
  onOpenSettings: () => void
  onToggleTheme: () => void
  onLanguageChange: (language: string) => void
}

function HubView({
  banner,
  user,
  isPlatformAdmin,
  servers,
  isLoadingServers,
  canCreateServer,
  joinCode,
  isJoining,
  joinError,
  theme,
  language,
  languageOptions,
  onOpenServer,
  onCreateServer,
  onJoinCodeChange,
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

      {/* Tudo abaixo do logo compartilha a mesma largura. */}
      <div className="mt-12 flex w-full max-w-sm flex-col items-center gap-3">
        <section aria-label={user.name} className="bg-card text-card-foreground flex w-full items-center gap-3 rounded-md border px-4 py-3">
          <UserAvatar name={user.name} imageUrl={user.avatarUrl} size="xl" />
          <div className="min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          </div>
        </section>

        <div className="flex items-center gap-1">
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

        {banner}

        <div className="mt-10 flex w-full flex-wrap gap-2.5">
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
                      <ServerIcon name={server.name} imageUrl={server.iconUrl} className="size-7" />
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

        <p className="mt-2 text-sm">{t('hub.orJoin')}</p>

        <form
          noValidate
          className="flex w-full flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onJoin()
          }}
        >
          <div className="flex gap-2">
            <Input
              aria-label={t('hub.joinPlaceholder')}
              placeholder={t('hub.joinPlaceholder')}
              value={joinCode}
              onChange={(event) => onJoinCodeChange(event.target.value)}
              aria-invalid={Boolean(joinError)}
              autoComplete="off"
              spellCheck={false}
              className="h-9 flex-1 font-semibold tracking-wide uppercase placeholder:font-normal placeholder:tracking-normal placeholder:normal-case"
            />
            <Button type="submit" variant="secondary" className="h-9" disabled={isJoining || !joinCode.trim()}>
              {isJoining && <Loader2Icon className="animate-spin" aria-hidden />}
              {t('hub.join')}
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>
          {joinError && <FieldError>{t(`hub.joinErrors.${joinError}`)}</FieldError>}
        </form>
      </div>
    </div>
  )
}

export { HubView }
export type { HubJoinError, HubServer, HubUser, HubViewProps }
