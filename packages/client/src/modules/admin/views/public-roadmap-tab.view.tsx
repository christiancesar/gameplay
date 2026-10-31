import { zodResolver } from '@hookform/resolvers/zod'
import {
  createRoadmapItemSchema,
  type CreateRoadmapItem,
  type RoadmapItem,
  type RoadmapStatus,
} from '@gameplay/contracts'
import { EditIcon, ArchiveIcon, PlusIcon } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Textarea } from '@/shared/ui/textarea'

type PublicRoadmapTabViewProps = {
  items: readonly RoadmapItem[]
  editing: RoadmapItem | null
  isSaving: boolean
  onEdit: (item: RoadmapItem) => void
  onCancel: () => void
  onArchive: (id: string) => void
  onSubmit: (input: CreateRoadmapItem) => void
}

type RoadmapFormValues = z.input<typeof createRoadmapItemSchema>

const EMPTY: RoadmapFormValues = {
  slug: '',
  title: '',
  description: '',
  status: 'exploring',
  position: 0,
  visibility: 'draft',
}
const STATUSES: RoadmapStatus[] = ['now', 'next', 'exploring', 'done']
const VISIBILITIES = ['draft', 'published', 'archived'] as const

function PublicRoadmapTabView({
  items,
  editing,
  isSaving,
  onEdit,
  onCancel,
  onArchive,
  onSubmit,
}: PublicRoadmapTabViewProps) {
  const { t } = useTranslation()
  const form = useForm<RoadmapFormValues>({
    resolver: zodResolver(createRoadmapItemSchema),
    values: editing
      ? {
          slug: editing.slug,
          title: editing.title,
          description: editing.description,
          status: editing.status,
          position: editing.position,
          visibility: editing.visibility,
        }
      : EMPTY,
  })
  const errors = form.formState.errors

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">{t('admin.public.roadmap.title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('admin.public.roadmap.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusIcon aria-hidden />
            {t(editing ? 'admin.public.roadmap.edit' : 'admin.public.roadmap.create')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form noValidate className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <Field data-invalid={Boolean(errors.slug)}>
              <FieldLabel htmlFor="public-roadmap-slug">{t('admin.public.fields.slug')}</FieldLabel>
              <Input id="public-roadmap-slug" {...form.register('slug')} aria-invalid={Boolean(errors.slug)} />
              {errors.slug && <FieldError>{t('admin.public.errors.invalidField')}</FieldError>}
            </Field>
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel htmlFor="public-roadmap-title">{t('admin.public.fields.title')}</FieldLabel>
              <Input id="public-roadmap-title" {...form.register('title')} aria-invalid={Boolean(errors.title)} />
              {errors.title && <FieldError>{t('admin.public.errors.invalidField')}</FieldError>}
            </Field>
            <Field className="md:col-span-2" data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="public-roadmap-description">{t('admin.public.fields.description')}</FieldLabel>
              <Textarea id="public-roadmap-description" rows={4} {...form.register('description')} />
              {errors.description && <FieldError>{t('admin.public.errors.invalidField')}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="public-roadmap-status">{t('admin.public.fields.status')}</FieldLabel>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="public-roadmap-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`public.roadmap.status.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="public-roadmap-visibility">{t('admin.public.fields.visibility')}</FieldLabel>
              <Controller
                name="visibility"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="public-roadmap-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITIES.map((visibility) => (
                        <SelectItem key={visibility} value={visibility}>
                          {t(`admin.public.visibility.${visibility}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="public-roadmap-position">{t('admin.public.fields.position')}</FieldLabel>
              <Input
                id="public-roadmap-position"
                type="number"
                min={0}
                {...form.register('position', { valueAsNumber: true })}
              />
            </Field>
            <div className="flex items-end gap-2">
              <SubmitButton
                isSubmitting={isSaving}
                label={t(editing ? 'common.save' : 'admin.public.actions.create')}
              />
              {editing && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  {t('common.cancel')}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.public.fields.title')}</TableHead>
              <TableHead>{t('admin.public.fields.status')}</TableHead>
              <TableHead>{t('admin.public.fields.visibility')}</TableHead>
              <TableHead>{t('admin.public.fields.votes')}</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">{t('common.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  {t('admin.empty')}
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-muted-foreground text-xs">{item.slug}</div>
                </TableCell>
                <TableCell>{t(`public.roadmap.status.${item.status}`)}</TableCell>
                <TableCell>
                  <Badge variant={item.visibility === 'published' ? 'default' : 'outline'}>
                    {t(`admin.public.visibility.${item.visibility}`)}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">{item.voteCount}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${t('admin.public.actions.edit')}: ${item.title}`}
                      onClick={() => onEdit(item)}
                    >
                      <EditIcon />
                    </Button>
                    {item.visibility !== 'archived' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${t('admin.public.actions.archive')}: ${item.title}`}
                        onClick={() => onArchive(item.id)}
                      >
                        <ArchiveIcon />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export { PublicRoadmapTabView }
export type { PublicRoadmapTabViewProps }
