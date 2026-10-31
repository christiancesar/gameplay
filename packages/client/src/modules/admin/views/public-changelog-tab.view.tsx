import { zodResolver } from '@hookform/resolvers/zod'
import { createChangelogEntrySchema, type ChangelogEntry, type CreateChangelogEntry } from '@gameplay/contracts'
import { EditIcon, PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Textarea } from '@/shared/ui/textarea'

const changelogFormSchema = createChangelogEntrySchema.extend({ tags: z.string() })
type ChangelogFormValues = z.input<typeof changelogFormSchema>

type PublicChangelogTabViewProps = {
  entries: readonly ChangelogEntry[]
  editing: ChangelogEntry | null
  isSaving: boolean
  onEdit: (entry: ChangelogEntry) => void
  onCancel: () => void
  onSubmit: (input: CreateChangelogEntry) => void
}

const EMPTY: ChangelogFormValues = {
  slug: '',
  version: '',
  title: '',
  summary: '',
  body: '',
  tags: '',
  visibility: 'draft',
  publishedAt: null,
}

function PublicChangelogTabView({
  entries,
  editing,
  isSaving,
  onEdit,
  onCancel,
  onSubmit,
}: PublicChangelogTabViewProps) {
  const { t } = useTranslation()
  const form = useForm<ChangelogFormValues>({
    resolver: zodResolver(changelogFormSchema),
    values: editing
      ? {
          slug: editing.slug,
          version: editing.version,
          title: editing.title,
          summary: editing.summary,
          body: editing.body,
          tags: editing.tags.join(', '),
          visibility: editing.visibility,
          publishedAt: editing.publishedAt,
        }
      : EMPTY,
  })
  const errors = form.formState.errors

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">{t('admin.public.changelog.title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('admin.public.changelog.description')}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusIcon aria-hidden />
            {t(editing ? 'admin.public.changelog.edit' : 'admin.public.changelog.create')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="grid gap-4 md:grid-cols-2"
            onSubmit={form.handleSubmit((values) =>
              onSubmit({
                ...values,
                tags: values.tags
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              }),
            )}
          >
            {(['slug', 'version', 'title', 'summary'] as const).map((name) => (
              <Field key={name} data-invalid={Boolean(errors[name])}>
                <FieldLabel htmlFor={`public-changelog-${name}`}>{t(`admin.public.fields.${name}`)}</FieldLabel>
                <Input id={`public-changelog-${name}`} {...form.register(name)} />
                {errors[name] && <FieldError>{t('admin.public.errors.invalidField')}</FieldError>}
              </Field>
            ))}
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="public-changelog-body">{t('admin.public.fields.body')}</FieldLabel>
              <Textarea id="public-changelog-body" rows={5} {...form.register('body')} />
              {errors.body && <FieldError>{t('admin.public.errors.invalidField')}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="public-changelog-tags">{t('admin.public.fields.tags')}</FieldLabel>
              <Input id="public-changelog-tags" {...form.register('tags')} />
              <p className="text-muted-foreground text-xs">{t('admin.public.changelog.tagsHint')}</p>
            </Field>
            <Field>
              <FieldLabel htmlFor="public-changelog-visibility">{t('admin.public.fields.visibility')}</FieldLabel>
              <select
                id="public-changelog-visibility"
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                {...form.register('visibility')}
              >
                <option value="draft">{t('admin.public.visibility.draft')}</option>
                <option value="published">{t('admin.public.visibility.published')}</option>
                <option value="archived">{t('admin.public.visibility.archived')}</option>
              </select>
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
              <TableHead>{t('admin.public.fields.version')}</TableHead>
              <TableHead>{t('admin.public.fields.visibility')}</TableHead>
              <TableHead className="w-16">
                <span className="sr-only">{t('common.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  {t('admin.empty')}
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="font-medium">{entry.title}</div>
                  <div className="text-muted-foreground text-xs">{entry.slug}</div>
                </TableCell>
                <TableCell>{entry.version}</TableCell>
                <TableCell>
                  <Badge variant={entry.visibility === 'published' ? 'default' : 'outline'}>
                    {t(`admin.public.visibility.${entry.visibility}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${t('admin.public.actions.edit')}: ${entry.title}`}
                    onClick={() => onEdit(entry)}
                  >
                    <EditIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export { PublicChangelogTabView }
export type { PublicChangelogTabViewProps }
