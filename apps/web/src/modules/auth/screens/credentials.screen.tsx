import { useSignInViewModel } from '@/modules/auth/view-models/use-sign-in.view-model'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'
import { SignInView } from '@/modules/auth/views/sign-in.view'

export function CredentialsScreen() {
  const viewModel = useSignInViewModel()
  const { language, languageOptions, setLanguage } = useLanguageViewModel()

  return (
    <SignInView {...viewModel} language={language} languageOptions={languageOptions} onLanguageChange={setLanguage} />
  )
}
