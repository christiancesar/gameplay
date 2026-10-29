import { Headphones, House, MonitorUp, MoreHorizontal, Plus, Server, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function HomeProductPreview() {
  const { t } = useTranslation()

  return (
    <div className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-2xl shadow-black/10">
      <div className="border-border/70 bg-muted/30 flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="bg-emerald-500 size-2 rounded-full" aria-hidden="true" />
          <span className="text-foreground text-xs font-medium">Gameplay</span>
          <span className="text-muted-foreground text-xs">{t('public.home.preview.app')}</span>
        </div>
        <span className="text-muted-foreground hidden text-[11px] sm:inline">{t('public.home.preview.connected')}</span>
      </div>

      <div className="grid min-h-[28rem] grid-cols-[3.5rem_minmax(8rem,11rem)_minmax(0,1fr)] sm:grid-cols-[4.5rem_12rem_minmax(0,1fr)]">
        <aside className="bg-muted/35 flex flex-col items-center gap-3 border-r px-2 py-4">
          <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex size-9 items-center justify-center rounded-xl">
            <House className="size-4" aria-hidden="true" />
          </div>
          <div className="bg-foreground/10 h-px w-6" aria-hidden="true" />
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl text-xs font-semibold">
            T
          </div>
          <div className="bg-muted flex size-9 items-center justify-center rounded-xl text-xs font-semibold">C</div>
          <div className="text-muted-foreground flex size-9 items-center justify-center rounded-xl border border-dashed">
            <Plus className="size-4" aria-hidden="true" />
          </div>
        </aside>

        <aside className="bg-muted/20 min-w-0 border-r p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{t('public.home.preview.server')}</p>
            <MoreHorizontal className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          </div>
          <p className="text-muted-foreground mt-1 text-[11px]">{t('public.home.preview.serverStatus')}</p>
          <div className="mt-7 space-y-1.5">
            <p className="text-muted-foreground px-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
              {t('public.home.preview.rooms')}
            </p>
            <div className="bg-accent text-foreground flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium">
              <Headphones className="text-emerald-600 dark:text-emerald-400 size-3.5" aria-hidden="true" />
              {t('public.home.preview.room')}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 rounded-lg px-2 py-2 text-xs">
              <MonitorUp className="size-3.5" aria-hidden="true" />
              {t('public.home.preview.screenRoom')}
            </div>
          </div>
          <div className="border-border/70 mt-8 border-t pt-4">
            <p className="text-muted-foreground px-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
              {t('public.home.preview.people')}
            </p>
            <div className="mt-3 flex items-center gap-2 px-2">
              <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                V
              </span>
              <span className="truncate text-xs">{t('public.home.preview.you')}</span>
              <span
                className="bg-emerald-500 ml-auto size-1.5 rounded-full"
                aria-label={t('public.home.preview.online')}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 px-2">
              <span className="bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                A
              </span>
              <span className="truncate text-xs">Alex</span>
              <span className="bg-emerald-500 ml-auto size-1.5 rounded-full" aria-hidden="true" />
            </div>
          </div>
        </aside>

        <section className="bg-background/70 min-w-0 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Server className="text-emerald-600 dark:text-emerald-400 size-4" aria-hidden="true" />
                <h3 className="truncate text-sm font-semibold sm:text-base">{t('public.home.preview.room')}</h3>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{t('public.home.preview.roomSubtitle')}</p>
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 flex shrink-0 items-center gap-1.5 text-[11px] font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {t('public.home.preview.live')}
            </div>
          </div>

          <div className="bg-muted/45 mt-6 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
                {t('public.home.preview.voiceRoom')}
              </span>
              <span className="bg-background text-muted-foreground rounded-full px-2 py-1 text-[10px]">
                {t('public.home.preview.inviteOnly')}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-background rounded-lg p-3">
                <div className="bg-emerald-500/20 flex size-8 items-center justify-center rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  V
                </div>
                <p className="mt-4 text-xs font-medium">{t('public.home.preview.you')}</p>
                <p className="text-emerald-600 dark:text-emerald-400 mt-1 text-[10px]">
                  {t('public.home.preview.speaking')}
                </p>
              </div>
              <div className="bg-background/60 rounded-lg p-3">
                <div className="bg-muted flex size-8 items-center justify-center rounded-full text-xs font-semibold">
                  A
                </div>
                <p className="mt-4 text-xs font-medium">Alex</p>
                <p className="text-muted-foreground mt-1 text-[10px]">{t('public.home.preview.listening')}</p>
              </div>
            </div>
          </div>

          <div className="border-border/70 bg-muted/20 mt-3 flex items-center gap-3 rounded-xl border p-3">
            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
              <MonitorUp className="text-emerald-600 dark:text-emerald-400 size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium">{t('public.home.preview.sharing')}</p>
              <p className="text-muted-foreground mt-1 truncate text-[10px]">
                {t('public.home.preview.sharingDescription')}
              </p>
            </div>
            <Users className="text-muted-foreground ml-auto size-4 shrink-0" aria-hidden="true" />
          </div>
        </section>
      </div>
    </div>
  )
}

export { HomeProductPreview }
