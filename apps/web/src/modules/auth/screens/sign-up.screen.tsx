import { useSignUpViewModel } from '@/modules/auth/view-models/use-sign-up.view-model'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'
import { SignUpView } from '@/modules/auth/views/sign-up.view'

export function SignUpScreen() {
  const viewModel = useSignUpViewModel()
  const { language, languageOptions, setLanguage } = useLanguageViewModel()

  return (
    <SignUpView {...viewModel} language={language} languageOptions={languageOptions} onLanguageChange={setLanguage} />
  )
}
