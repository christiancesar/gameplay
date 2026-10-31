import {
  createFeatureRequestSchema,
  type CreateFeatureRequest,
  type RoadmapItem,
  type RoadmapStatus,
} from '@gameplay/contracts'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Badge } from '@/shared/ui/badge'

import { RoadmapColumn } from './column.view'

type RoadmapViewProps = {
  items: RoadmapItem[]
  hasError: boolean
  isAuthenticated: boolean
  isLoading: boolean
  isSubmittingRequest: boolean
  isVoting: boolean
  onRequireAuth: () => void
  onRequestDialogOpen: () => void
  onSubmitRequest: (input: CreateFeatureRequest) => void
  onVote: (itemId: string, votedByMe: boolean) => void
  requestSent: boolean
}

const ROADMAP_STATUSES: RoadmapStatus[] = ['now', 'next', 'exploring', 'done']

function RoadmapView({
  items,
  hasError,
  isAuthenticated,
  isLoading,
  isSubmittingRequest,
  isVoting,
  onRequireAuth,
  onRequestDialogOpen,
  onSubmitRequest,
  onVote,
  requestSent,
}: RoadmapViewProps) {
  const { t } = useTranslation()
  const form = useForm<CreateFeatureRequest>({
    resolver: zodResolver(createFeatureRequestSchema),
    defaultValues: { title: '', description: '' },
  })
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)
  const selectedItem = items.find((item) => item.id === selectedItemId)
  const itemsByStatus = useMemo(
    () =>
      Object.fromEntries(ROADMAP_STATUSES.map((status) => [status, items.filter((item) => item.status === status)])),
    [items],
  ) as Record<RoadmapStatus, RoadmapItem[]>

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-emerald-600 dark:text-emerald-400 mb-4 text-sm font-semibold tracking-[0.18em] uppercase">
          {t('public.roadmap.eyebrow')}
        </p>
        <h1 className="text-foreground text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          {t('public.roadmap.title')}
        </h1>
        <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-relaxed">{t('public.roadmap.description')}</p>
      </div>
      <Card className="mt-8 max-w-3xl">
        <CardHeader>
          <CardTitle>{t('public.roadmap.requestTitle')}</CardTitle>
          <CardDescription>{t('public.roadmap.requestDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            onClick={() => {
              onRequestDialogOpen()
              setRequestOpen(true)
            }}
          >
            {t('public.roadmap.requestCta')}
          </Button>
        </CardContent>
      </Card>
      {isLoading && <p className="text-muted-foreground mt-12">{t('public.roadmap.loading')}</p>}
      {hasError && (
        <p role="alert" className="text-destructive mt-12">
          {t('public.roadmap.errors.load')}
        </p>
      )}
      {!isLoading && !hasError && (
        <div className="mt-12 flex max-w-3xl flex-col gap-10">
          {ROADMAP_STATUSES.map((status) => (
            <RoadmapColumn
              key={status}
              status={status}
              items={itemsByStatus[status]}
              isAuthenticated={isAuthenticated}
              isVoting={isVoting}
              onRequireAuth={onRequireAuth}
              onOpenDetails={(item) => setSelectedItemId(item.id)}
              onVote={onVote}
            />
          ))}
        </div>
      )}
      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItemId(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t(`public.roadmap.status.${selectedItem.status}`)}</Badge>
                  <span className="text-muted-foreground text-xs">
                    {t('public.roadmap.votes', { count: selectedItem.voteCount })}
                  </span>
                </div>
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>{t('public.roadmap.detailDescription')}</DialogDescription>
              </DialogHeader>
              <p className="text-muted-foreground text-sm leading-relaxed">{selectedItem.description}</p>
              <DialogFooter showCloseButton>
                <Button
                  type="button"
                  variant={selectedItem.votedByMe ? 'success' : 'outline'}
                  disabled={isVoting}
                  onClick={() => {
                    if (isAuthenticated) onVote(selectedItem.id, selectedItem.votedByMe)
                    else onRequireAuth()
                  }}
                >
                  {selectedItem.votedByMe ? t('public.roadmap.removeVote') : t('public.roadmap.vote')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={requestOpen}
        onOpenChange={(open) => {
          setRequestOpen(open)
          if (!open) form.reset()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('public.roadmap.requestTitle')}</DialogTitle>
            <DialogDescription>{t('public.roadmap.requestDescription')}</DialogDescription>
          </DialogHeader>
          {!isAuthenticated ? (
            <Button
              type="button"
              onClick={() => {
                setRequestOpen(false)
                onRequireAuth()
              }}
            >
              {t('public.roadmap.signInToRequest')}
            </Button>
          ) : requestSent ? (
            <p className="text-emerald-600 dark:text-emerald-400">{t('public.roadmap.requestSent')}</p>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmitRequest)} noValidate>
              <Field data-invalid={Boolean(form.formState.errors.title)}>
                <FieldLabel htmlFor="feature-request-title">{t('public.roadmap.requestTitleField')}</FieldLabel>
                <Input
                  id="feature-request-title"
                  {...form.register('title')}
                  aria-invalid={Boolean(form.formState.errors.title)}
                />
                {form.formState.errors.title && <FieldError>{t('public.roadmap.requestInvalid')}</FieldError>}
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.description)}>
                <FieldLabel htmlFor="feature-request-description">
                  {t('public.roadmap.requestDescriptionField')}
                </FieldLabel>
                <Textarea
                  id="feature-request-description"
                  rows={4}
                  {...form.register('description')}
                  aria-invalid={Boolean(form.formState.errors.description)}
                />
                {form.formState.errors.description && <FieldError>{t('public.roadmap.requestInvalid')}</FieldError>}
              </Field>
              <Button type="submit" disabled={isSubmittingRequest}>
                {t('public.roadmap.submitRequest')}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}

export { RoadmapView }
export type { RoadmapViewProps }
