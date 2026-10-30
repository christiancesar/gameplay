# FE-02 · SignIn, 2FA, SignUp e sair da conta

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: FE-01 · Onda 2

## Contexto
Primeiro fluxo real sobre a API. O Better Auth aceita email ou username, e o admin da plataforma passa pelo 2FA (TOTP ou código de recuperação). As etapas mudam a URL na mesma rota.

## Escopo
- `modules/auth`: ViewModels `use-sign-in`, `use-two-factor`, `use-recovery-code`, `use-sign-up`, `use-sign-out`; Screens para `/sign-in` (por `step`) e `/sign-up`.
- Sign-in: erro genérico para credenciais inválidas, mensagem de conta suspensa, desvio para `?step=two-factor` quando o Better Auth pedir 2FA. Abrir uma etapa de 2FA sem login pendente volta para `/sign-in` com `replace`.
- Depois do sucesso: `?redirect` (convite do F3) ou Hub. Invalidar a query `['session']`.
- Sign-up com key de cadastro (6 caixas, normalizada pelo ViewModel) e `?invite=` repassado para a API. Key inválida, expirada, revogada ou usada: erro abaixo das caixas via `useServerErrors`.
- Sign-out com confirmação (usado no Hub e nas Configurações): limpa o QueryClient e vai para `/sign-in`.
- Mapear os códigos de erro da API para chaves de i18n.

## Fora do escopo
Setup do 2FA do admin (FE-11), convite de servidor (FE-04).

## Referências
- `plans/[complete]-core-product/02-core-flows.md` F1, F2
- `plans/[complete]-backend/tickets/BE-04-auth-better-auth.md`, `BE-05-keys-de-cadastro.md`, `BE-10-convites-e-membros.md` (convite no sign-up)
- Views em `modules/auth/views`

## Checklist
- [x] ViewModels com `.spec.ts` (renderHook, auth client mockado)
- [x] Screens e rotas ligadas
- [x] Erros do servidor no formulário
- [x] Teste manual com o admin do seed (`admin@gameplay.local`), só por curl
- [x] Commit

## Critério de aceite
Login por email e por username, fluxo de 2FA com voltar do browser entre etapas, cadastro com key e sair da conta funcionam contra a API local.

## Notas da execução (2026-10-25)

O OpenCode tinha começado este ticket. No review, a versão dele tinha problemas graves e foi reescrita (Sonnet):
- O 2FA nunca disparava: o Better Auth não devolve erro, devolve `data.twoFactorRedirect: true` num login com sucesso.
- As chaves de erro saíam com prefixo duplo (`auth.errors.auth.errors.x`).
- O sign-up mandava `inviteCode`, mas a API espera `serverInviteCode`; os erros eram mapeados por `includes('KEY')`.
- `isSubmitting` fixo em `false`, estado na Screen, vários `as any`, e o `redirect` aceitava `//site-externo`.

Feito:
- `model/mappers/auth-error.mapper.ts` com os códigos reais: `INVALID_EMAIL_OR_PASSWORD`, `INVALID_USERNAME_OR_PASSWORD`, `BANNED_USER` (conta suspensa), `INVALID_CODE`, `INVALID_BACKUP_CODE`, `INVALID_TWO_FACTOR_COOKIE`, `USERNAME_IS_ALREADY_TAKEN`, `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`, `INVALID_REGISTRATION_KEY`, `VALIDATION_FAILED` e 429.
- `model/rules/safe-redirect.ts`: só caminho do mesmo domínio.
- ViewModels com `useMutation` (`use-sign-in`, `use-two-factor`, `use-recovery-code`, `use-sign-up`, `use-sign-out`), cada um com spec. Fakes, seed e contexto em `view-models/test/`, um por arquivo.
- `sign-in.screen.tsx` só escolhe a etapa; `credentials.screen.tsx`, `two-factor.screen.tsx` e `recovery-code.screen.tsx` montam cada uma o seu ViewModel.
- Store `pending-two-factor.store.ts`: abrir uma etapa de 2FA sem login pendente volta para `/sign-in` com `replace`.
- `refreshSession` refaz a query `['session']` antes de navegar, senão os guards veem a sessão antiga.
- Erros de campo do sign-up chegam pela prop da View e pelo `useServerErrors`.

Teste manual (curl pelo proxy do Vite): login do admin do seed devolve 200 sem `twoFactorRedirect` (o admin do seed está sem 2FA); senha errada 401 `INVALID_EMAIL_OR_PASSWORD`; username inexistente 401 `INVALID_USERNAME_OR_PASSWORD`; key inválida 400 `INVALID_REGISTRATION_KEY`. O fluxo de 2FA só foi testado nos specs. Falta o teste no browser.

Resultado: web 306 testes (unit e storybook), api 271, typecheck, lint e format verdes.

Suposições *(confirmar)*:
- A marca de 2FA pendente fica só em memória: recarregar a página na etapa do 2FA volta para o login. *(suposição)*
- `INVALID_TWO_FACTOR_COOKIE` limpa a marca e volta para a etapa de credenciais. *(suposição)*
- Falha de rede e 5xx no login mostram `unexpected`, não credenciais inválidas. *(suposição)*
- 429 no sign-up aparece no campo da key, como na story. *(suposição)*
- `VALIDATION_FAILED` no sign-up vira erro geral `unexpected`, já que a View valida os mesmos campos. *(suposição)*
- O web manda `name` igual ao username, porque o tipo do client exige. *(suposição)*
- O link entre sign-in e sign-up não leva o `invite`; um convite que veio em `redirect=/i/CODE` não chega ao sign-up. Fica para o FE-04. *(suposição)*
- `invitedServerName` da View de sign-up fica vazio até o FE-04. *(suposição)*
- Confirmação do sair da conta fica nas Screens do FE-03 e FE-08; o ViewModel só expõe `signOut` e `isSigningOut`. *(suposição)*
