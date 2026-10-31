import type { CreateFeatureRequest, RoadmapItem } from '@gameplay/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'

import { publicContentKeys } from '../model/services/public-content.keys'
import {
  createPublicFeatureRequest,
  removePublicRoadmapVote,
  votePublicRoadmap,
} from '../model/services/public-content.service'
import { publicRoadmapQueryOptions } from '../model/services/public-content.query'

function usePublicRoadmapViewModel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)
  const roadmap = useQuery(publicRoadmapQueryOptions)
  const voteMutation = useMutation({
    mutationFn: ({ itemId, votedByMe }: { itemId: string; votedByMe: boolean }) =>
      votedByMe ? removePublicRoadmapVote(itemId) : votePublicRoadmap(itemId),
    onSuccess: (result) => {
      queryClient.setQueryData(publicContentKeys.roadmap(), (current: { items: RoadmapItem[] } | undefined) => {
        if (!current) return current
        return {
          items: current.items.map((item) =>
            item.id === result.itemId ? { ...item, voteCount: result.voteCount, votedByMe: result.voted } : item,
          ),
        }
      })
    },
    onError: () => toast.error(t('public.roadmap.errors.vote')),
  })
  const requestMutation = useMutation({
    mutationFn: createPublicFeatureRequest,
    onSuccess: () => toast.success(t('public.roadmap.requestSent')),
    onError: () => toast.error(t('public.roadmap.errors.request')),
  })

  return {
    items: roadmap.data?.items ?? [],
    isLoading: roadmap.isLoading,
    hasError: roadmap.isError,
    isAuthenticated: Boolean(session),
    isVoting: voteMutation.isPending,
    isSubmittingRequest: requestMutation.isPending,
    requestSent: requestMutation.isSuccess,
    onVote: (itemId: string, votedByMe: boolean) => {
      if (session) voteMutation.mutate({ itemId, votedByMe })
    },
    onSubmitRequest: (input: CreateFeatureRequest) => {
      if (session) requestMutation.mutate(input)
    },
    onRequestDialogOpen: () => requestMutation.reset(),
  }
}

export { usePublicRoadmapViewModel }
