import type { HubNotification } from '@/modules/notifications/model/entities/hub-notification'
import { cn } from 'cn'
import {
  BellIcon,
  CalendarClockIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  GaugeIcon,
  GlobeIcon,
  InfoIcon,
  MonitorIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { RECOMMENDED_BROWSERS } from '@/modules/browser-support/views/browser-support-alert.view'
import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { SectionLabel } from '@/shared/ui/section-label'

/** Cada tipo tem conteúdo próprio; o ViewModel decide quais existem. */
type NotificationsPanelViewProps = {
  notifications: readonly HubNotification[]
  onDismiss: (id: string) => void
  onClearAll: () => void
  onAllowMonitors: () => void
  onOpenServer: (serverId: string) => void
  className?: string
}

type Tone = 'warning' | 'info' | 'success' | 'danger'

const TONE_CLASS: Record<Tone, string> = {
  warning: 'text-amber-500',
  info: 'text-muted-foreground',
  success: 'text-emerald-500',
  danger: 'text-red-500',
}

function NotificationsPanelView({
  notifications,
  onDismiss,
  onClearAll,
  onAllowMonitors,
  onOpenServer,
  className,
}: NotificationsPanelViewProps) {
  const { t, i18n } = useTranslation()

  const render = (
    notification: HubNotification,
  ): { icon: ComponentType<{ className?: string }>; tone: Tone; title: string; body?: ReactNode } => {
    switch (notification.type) {
      case 'browserUnsupported':
        return {
          icon: GlobeIcon,
          tone: 'warning',
          title: t('browserSupport.unsupportedTitle', { browser: notification.browser.name }),
          body: (
            <>
              <span className="block">{t('browserSupport.unsupportedDescription')}</span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {RECOMMENDED_BROWSERS.map((item) => (
                  <Button key={item.name} asChild variant="outline" size="xs">
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.name}
                      <ExternalLinkIcon data-icon="inline-end" aria-hidden />
                    </a>
                  </Button>
                ))}
              </span>
            </>
          ),
        }
      case 'browserOutdated':
        return {
          icon: GlobeIcon,
          tone: 'warning',
          title: t('browserSupport.outdatedTitle', { browser: notification.browser.name }),
          body: `${t('browserSupport.outdatedDescription', { version: notification.browser.version, min: notification.minVersion })} ${t('browserSupport.howToUpdate')}`,
        }
      case 'vpn':
        return {
          icon: ShieldAlertIcon,
          tone: 'warning',
          title: t('notifications.vpn.title'),
          body: t('notifications.vpn.description'),
        }
      case 'accelerationOff':
        return {
          icon: GaugeIcon,
          tone: 'warning',
          title: t('notifications.accelerationOff.title'),
          body: t('notifications.accelerationOff.description'),
        }
      case 'monitorsPermission':
        return {
          icon: MonitorIcon,
          tone: 'info',
          title: t('notifications.monitors.title'),
          body: (
            <>
              <span className="block">{t('notifications.monitors.description')}</span>
              <Button size="xs" className="mt-2" onClick={onAllowMonitors}>
                {t('hardware.allow')}
              </Button>
            </>
          ),
        }
      case 'joinApproved':
        return {
          icon: CircleCheckIcon,
          tone: 'success',
          title: t('notifications.joinApproved.title', { server: notification.server.name }),
          body: (
            <>
              <span className="block">{t('notifications.joinApproved.description')}</span>
              <Button size="xs" variant="outline" className="mt-2" onClick={() => onOpenServer(notification.server.id)}>
                {t('notifications.open')}
              </Button>
            </>
          ),
        }
      case 'requestSent':
        return {
          icon: InfoIcon,
          tone: 'info',
          title: t('notifications.requestSent.title', { server: notification.server.name }),
          body: t('notifications.requestSent.description'),
        }
      case 'kicked':
      case 'serverDeleted':
        return {
          icon: TriangleAlertIcon,
          tone: 'danger',
          title: t(`notifications.${notification.type}.title`, { server: notification.server.name }),
        }
      case 'inviteExpired':
        return {
          icon: CalendarClockIcon,
          tone: 'warning',
          title: t('notifications.inviteExpired.title', { server: notification.server.name }),
          body: t('notifications.inviteExpired.description'),
        }
      case 'promoted':
      case 'demoted':
        return {
          icon: InfoIcon,
          tone: 'info',
          title: t(`notifications.${notification.type}.title`, { server: notification.server.name }),
        }
    }
  }

  return (
    <section aria-label={t('notifications.title')} className={cn('flex w-full flex-col gap-2', className)}>
      <SectionLabel
        icon={BellIcon}
        count={notifications.length}
        action={
          notifications.length > 1 && (
            <Button variant="ghost" size="xs" className="-my-1" onClick={onClearAll}>
              {t('notifications.clearAll')}
            </Button>
          )
        }
      >
        {t('notifications.title')}
      </SectionLabel>

      {notifications.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-xs">
          {t('notifications.empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const { icon: Icon, tone, title, body } = render(notification)
            return (
              <li key={notification.id} className="bg-card text-card-foreground flex gap-3 rounded-md border p-3">
                <Icon className={cn('mt-0.5 size-4 shrink-0', TONE_CLASS[tone])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug font-medium">{title}</p>
                  {body && <div className="text-muted-foreground mt-1 text-xs leading-snug">{body}</div>}
                  {notification.createdAt && (
                    <p className="text-muted-foreground/70 mt-1.5 text-[11px]">
                      {formatRelativeTime(notification.createdAt, i18n.language)}
                    </p>
                  )}
                </div>
                <IconButton
                  label={`${t('notifications.dismiss')}: ${title}`}
                  icon={<XIcon />}
                  size="icon-xs"
                  className="text-muted-foreground -mt-1 -mr-1"
                  onClick={() => onDismiss(notification.id)}
                />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export { NotificationsPanelView }
export type { NotificationsPanelViewProps }
