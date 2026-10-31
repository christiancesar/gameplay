import type { AdminFeatureRequest, RoadmapItem } from '@gameplay/contracts'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { TableCell, TableRow } from '@/shared/ui/table'

type PublicFeatureRequestRowProps = {
  request: AdminFeatureRequest
  roadmapItems: readonly RoadmapItem[]
  isSaving: boolean
  onModerate: (id: string, input: { status: AdminFeatureRequest['status']; roadmapItemId?: string | null }) => void
}

function PublicFeatureRequestRow({ request, roadmapItems, isSaving, onModerate }: PublicFeatureRequestRowProps) {
  const { t } = useTranslation()
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{request.title}</div>
        <p className="text-muted-foreground max-w-sm truncate text-xs">{request.description}</p>
      </TableCell>
      <TableCell>{request.author.username}</TableCell>
      <TableCell>
        <Badge variant={request.status === 'approved' ? 'default' : 'outline'}>
          {t(`admin.public.status.${request.status}`)}
        </Badge>
      </TableCell>
      <TableCell>
        <Select
          defaultValue={request.roadmapItemId ?? 'none'}
          onValueChange={(value) =>
            onModerate(request.id, { status: request.status, roadmapItemId: value === 'none' ? null : value })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('admin.public.requests.noRoadmap')}</SelectItem>
            {roadmapItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            size="xs"
            variant="outline"
            disabled={isSaving || request.status === 'approved'}
            onClick={() => onModerate(request.id, { status: 'approved', roadmapItemId: request.roadmapItemId })}
          >
            {t('admin.public.status.approved')}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isSaving || request.status === 'rejected'}
            onClick={() => onModerate(request.id, { status: 'rejected', roadmapItemId: request.roadmapItemId })}
          >
            {t('admin.public.status.rejected')}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export { PublicFeatureRequestRow }
export type { PublicFeatureRequestRowProps }
