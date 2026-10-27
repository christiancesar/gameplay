import { useTwoFactorViewModel } from '@/modules/auth/view-models/use-two-factor.view-model'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'
import { TwoFactorView } from '@/modules/auth/views/two-factor.view'

export function TwoFactorScreen() {
  const viewModel = useTwoFactorViewModel()
  const { language, languageOptions, setLanguage } = useLanguageViewModel()

  return (
    <TwoFactorView
      {...viewModel}
      language={language}
      languageOptions={languageOptions}
      onLanguageChange={setLanguage}
    />
  )
}
