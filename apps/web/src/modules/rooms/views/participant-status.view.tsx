import { HeadphoneOffIcon, HeadphonesIcon, MicIcon, MicOffIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ParticipantStatusProps = {
  isMuted: boolean
  isDeafened: boolean
}

/** Ícones de microfone e fone de um participante, como na lista de salas do mock. */
function ParticipantStatusView({ isMuted, isDeafened }: ParticipantStatusProps) {
  const { t } = useTranslation()
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 [&_svg]:size-3.5">
      {isMuted ? (
        <MicOffIcon role="img" aria-label={t('voice.muted')} className="text-red-500" />
      ) : (
        <MicIcon aria-hidden />
      )}
      {isDeafened ? (
        <HeadphoneOffIcon role="img" aria-label={t('voice.deafened')} className="text-red-500" />
      ) : (
        <HeadphonesIcon aria-hidden />
      )}
    </span>
  )
}

export { ParticipantStatusView }
export type { ParticipantStatusProps }
