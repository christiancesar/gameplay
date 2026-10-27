import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { UserAvatar } from '@/shared/ui/user-avatar'

import { formatKbps } from '@/shared/ui/format-kbps'

import type { QualityLimitation, StreamQuality } from './share-panel.view'
import type { ShareFps, ShareResolution } from './share-setup-dialog.view'

type ViewerQuality = {
  id: string
  name: string
  avatarUrl?: string
  quality: StreamQuality
  isOnTarget: boolean
  limitation: QualityLimitation
}

type ShareDetailsDialogViewProps = {
  open: boolean
  target: { resolution: ShareResolution; fps: ShareFps }
  viewers: readonly ViewerQuality[]
  /** Servidor (SFU): o que cada um recebe é medido do lado de quem assiste. */
  mode?: 'sfu' | 'mesh'
  onOpenChange: (open: boolean) => void
}

/** A qualidade de cada espectador: em mesh medida no envio, no SFU informada por quem assiste. */
function ShareDetailsDialogView({ open, target, viewers, mode = 'mesh', onOpenChange }: ShareDetailsDialogViewProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('share.monitor.detailsTitle')}</DialogTitle>
          <DialogDescription>
            {t('share.monitor.target')}: {target.resolution} · {target.fps} fps.{' '}
            {mode === 'sfu' ? t('share.monitor.detailsDescriptionSfu') : t('share.monitor.detailsDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('share.monitor.viewer')}</TableHead>
                <TableHead>{t('share.setup.resolution')}</TableHead>
                <TableHead>FPS</TableHead>
                <TableHead>{t('share.stats.upload')}</TableHead>
                <TableHead>{t('share.stats.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewers.map((viewer) => (
                <TableRow key={viewer.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <UserAvatar name={viewer.name} imageUrl={viewer.avatarUrl} size="sm" />
                      {viewer.name}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{viewer.quality.height}p</TableCell>
                  <TableCell className="font-mono tabular-nums">{Math.round(viewer.quality.fps)}</TableCell>
                  <TableCell className="font-mono tabular-nums">{formatKbps(viewer.quality.kbps)}</TableCell>
                  <TableCell>
                    {viewer.isOnTarget ? (
                      <Badge variant="secondary" className="text-emerald-500">
                        {t('share.monitor.onTarget')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                        {viewer.limitation === 'none'
                          ? t('share.monitor.belowTarget')
                          : t(`share.monitor.limitedBy.${viewer.limitation}`)}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ShareDetailsDialogView }
export type { ShareDetailsDialogViewProps, ViewerQuality }
