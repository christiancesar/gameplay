import { EllipsisVerticalIcon, SearchIcon, SlidersHorizontalIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { Input } from '@/shared/ui/input'
import { ServerIcon } from '@/shared/ui/server-icon'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

type CountWithLimit = { count: number; limit: number; isOverride: boolean }

type AdminServerItem = {
  id: string
  name: string
  iconUrl?: string
  ownerName: string
  members: CountWithLimit
  rooms: CountWithLimit
}

type ServersTabViewProps = {
  servers: readonly AdminServerItem[]
  search: string
  onSearchChange: (value: string) => void
  onEditLimits: (serverId: string) => void
  onDelete: (serverId: string) => void
}

function ServersTabView({ servers, search, onSearchChange, onEditLimits, onDelete }: ServersTabViewProps) {
  const { t } = useTranslation()
  const [deleteTarget, setDeleteTarget] = useState<AdminServerItem>()

  const countCell = (value: CountWithLimit) => (
    <span className="tabular-nums">
      {value.count}/{value.limit}
      {!value.isOverride && <span className="text-muted-foreground"> ({t('admin.default')})</span>}
    </span>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-xs">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
        <Input aria-label={t('admin.search')} placeholder={t('admin.search')} value={search} className="pl-8" onChange={(event) => onSearchChange(event.target.value)} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.servers.server')}</TableHead>
              <TableHead>{t('admin.servers.owner')}</TableHead>
              <TableHead>{t('admin.servers.members')}</TableHead>
              <TableHead>{t('admin.servers.rooms')}</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">{t('common.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  {t('admin.empty')}
                </TableCell>
              </TableRow>
            )}
            {servers.map((server) => (
              <TableRow key={server.id}>
                <TableCell>
                  <span className="flex items-center gap-2 font-medium">
                    <ServerIcon name={server.name} imageUrl={server.iconUrl} />
                    {server.name}
                  </span>
                </TableCell>
                <TableCell>{server.ownerName}</TableCell>
                <TableCell>{countCell(server.members)}</TableCell>
                <TableCell>{countCell(server.rooms)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`${t('common.actions')}: ${server.name}`}>
                        <EllipsisVerticalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEditLimits(server.id)}>
                        <SlidersHorizontalIcon />
                        {t('admin.servers.editLimits')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(server)}>
                        <Trash2Icon />
                        {t('admin.servers.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          key={deleteTarget.id}
          defaultOpen
          onClose={() => setDeleteTarget(undefined)}
          title={`${t('admin.servers.delete')}: ${deleteTarget.name}`}
          description={t('serverSettings.danger.deleteDescription')}
          confirmLabel={t('admin.servers.delete')}
          cancelLabel={t('common.cancel')}
          destructive
          typeToConfirm={{ value: deleteTarget.name, label: t('serverSettings.danger.confirmName', { name: deleteTarget.name }) }}
          onConfirm={() => onDelete(deleteTarget.id)}
        />
      )}
    </div>
  )
}

export { ServersTabView }
export type { AdminServerItem, ServersTabViewProps }
