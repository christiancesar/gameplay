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
- `plans/02-core-flows.md` F1, F2
- `plans/tickets/BE-04-auth-better-auth.md`, `BE-05-keys-de-cadastro.md`, `BE-10-convites-e-membros.md` (convite no sign-up)
- Views em `modules/auth/views`

## Checklist
- [ ] ViewModels com `.spec.ts` (renderHook, auth client mockado)
- [ ] Screens e rotas ligadas
- [ ] Erros do servidor no formulário
- [ ] Teste manual com o admin do seed (`admin@gameplay.local`)
- [ ] Commit

## Critério de aceite
Login por email e por username, fluxo de 2FA com voltar do browser entre etapas, cadastro com key e sair da conta funcionam contra a API local.
