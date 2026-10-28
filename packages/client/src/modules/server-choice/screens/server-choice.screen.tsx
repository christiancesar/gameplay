import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'
import { useServerChoiceViewModel } from '@/modules/server-choice/view-models/use-server-choice.view-model'
import { ServerChoiceView } from '@/modules/server-choice/views/server-choice.view'

export function ServerChoiceScreen({ onChosen }: { onChosen: () => void }) {
  const viewModel = useServerChoiceViewModel({ onChosen })
  const { language, languageOptions, setLanguage } = useLanguageViewModel()

  return (
    <ServerChoiceView
      {...viewModel}
      language={language}
      languageOptions={languageOptions}
      onLanguageChange={setLanguage}
    />
  )
}
