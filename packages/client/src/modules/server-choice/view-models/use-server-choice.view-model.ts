import { useMutation } from '@tanstack/react-query'

import { normalizeServerAddress } from '@/modules/server-choice/model/rules/normalize-server-address'
import { checkServer } from '@/modules/server-choice/model/services/server-health.service'
import { usePlatform } from '@/shared/platform/use-platform'

type ServerChoiceError = 'invalid' | 'unreachable' | 'notGameplay'

/** First screen of a host where the user picks the server: checks the address, keeps it and moves on. */
function useServerChoiceViewModel({ onChosen }: { onChosen: () => void }) {
  const { server } = usePlatform()
  const check = useMutation({
    mutationFn: async (address: string): Promise<{ origin: string } | { error: ServerChoiceError }> => {
      const origin = normalizeServerAddress(address)
      if (!origin) return { error: 'invalid' }
      const result = await checkServer(origin)
      return result === 'ok' ? { origin } : { error: result }
    },
    onSuccess: async (result) => {
      if (!('origin' in result)) return
      await server.chooser?.choose(result.origin)
      onChosen()
    },
  })

  return {
    defaultValue: server.chooser?.current() ?? '',
    isChecking: check.isPending,
    error: check.data && 'error' in check.data ? check.data.error : undefined,
    onSubmit: (address: string) => check.mutate(address),
  }
}

export { useServerChoiceViewModel }
export type { ServerChoiceError }
