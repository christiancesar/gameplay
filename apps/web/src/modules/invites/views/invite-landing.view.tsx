import { CircleAlertIcon, UsersIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BrandLogo } from '@/shared/ui/brand-logo'
import { Button } from '@/shared/ui/button'
import { ServerIcon } from '@/shared/ui/server-icon'
import { SubmitButton } from '@/shared/ui/submit-button'

type InviteServer = { name: string; iconUrl?: string; memberCount: number }

type InviteError = 'expired' | 'exhausted' | 'serverFull' | 'notFound'

type InviteLandingState =
  | { status: 'signedOut'; server: InviteServer }
  | { status: 'confirm'; server: InviteServer; isJoining: boolean }
  | { status: 'error'; error: InviteError }

type InviteLandingViewProps = {
  state: InviteLandingState
  onCreateAccount: () => void
  onSignIn: () => void
  onJoin: () => void
  onBackToHub: () => void
}

/** F3: link de convite de servidor aberto no browser. */
function InviteLandingView({ state, onCreateAccount, onSignIn, onJoin, onBackToHub }: InviteLandingViewProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <BrandLogo className="w-36" />
      <div className="bg-card text-card-foreground flex w-full max-w-sm flex-col items-center gap-5 rounded-lg border p-6 text-center">
        {state.status === 'error' ? (
          <>
            <CircleAlertIcon className="text-destructive size-10" aria-hidden />
            <h1 className="text-lg font-medium">{t(`invite.errors.${state.error}`)}</h1>
            <Button className="w-full" onClick={onBackToHub}>
              {t('common.backToHub')}
            </Button>
          </>
        ) : (
          <>
            <ServerIcon name={state.server.name} imageUrl={state.server.iconUrl} className="size-16 rounded-xl text-xl" />
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-medium">
                {state.status === 'signedOut'
                  ? t('invite.invitedTitle', { server: state.server.name })
                  : t('invite.confirmTitle', { server: state.server.name })}
              </h1>
              <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
                <UsersIcon className="size-4" aria-hidden />
                {t('invite.confirmDescription', { count: state.server.memberCount })}
              </p>
            </div>
            {state.status === 'signedOut' ? (
              <div className="flex w-full flex-col gap-2">
                <Button size="lg" onClick={onCreateAccount}>
                  {t('invite.createAccount')}
                </Button>
                <Button size="lg" variant="ghost" onClick={onSignIn}>
                  {t('invite.haveAccount')}
                </Button>
                <p className="text-muted-foreground text-xs">{t('invite.keyHint')}</p>
              </div>
            ) : (
              <form
                className="flex w-full flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  onJoin()
                }}
              >
                <SubmitButton isSubmitting={state.isJoining} label={t('invite.join')} />
                <Button type="button" variant="ghost" onClick={onBackToHub} disabled={state.isJoining}>
                  {t('common.backToHub')}
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export { InviteLandingView }
export type { InviteError, InviteLandingState, InviteLandingViewProps }
