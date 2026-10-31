import type { AdminFeatureRequest, RoadmapItem } from '@gameplay/contracts'
import { useTranslation } from 'react-i18next'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

import { PublicFeatureRequestRow } from './public-feature-request-row.view'

type PublicFeatureRequestsTabViewProps = {
  requests: readonly AdminFeatureRequest[]
  roadmapItems: readonly RoadmapItem[]
  isSaving: boolean
  onModerate: (id: string, input: { status: AdminFeatureRequest['status']; roadmapItemId?: string | null }) => void
}

function PublicFeatureRequestsTabView({
  requests,
  roadmapItems,
  isSaving,
  onModerate,
}: PublicFeatureRequestsTabViewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">{t('admin.public.requests.title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('admin.public.requests.description')}</p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.public.fields.title')}</TableHead>
              <TableHead>{t('admin.public.fields.author')}</TableHead>
              <TableHead>{t('admin.public.fields.status')}</TableHead>
              <TableHead>{t('public.roadmap.title')}</TableHead>
              <TableHead className="w-28">
                <span className="sr-only">{t('common.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  {t('admin.public.requests.empty')}
                </TableCell>
              </TableRow>
            )}
            {requests.map((request) => (
              <PublicFeatureRequestRow
                key={request.id}
                request={request}
                roadmapItems={roadmapItems}
                isSaving={isSaving}
                onModerate={onModerate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export { PublicFeatureRequestsTabView }
export type { PublicFeatureRequestsTabViewProps }
