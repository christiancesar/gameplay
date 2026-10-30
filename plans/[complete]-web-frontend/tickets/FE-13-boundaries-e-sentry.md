# FE-13 · Lint de fronteiras MVVM e Sentry

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: FE-01 · Onda 2 (pode rodar a qualquer momento)

## Contexto
A direção das dependências (View, ViewModel, Model, Screen) precisa ser garantida por lint no CI. O Sentry entra quando houver DSN.

## Escopo
- `eslint-plugin-boundaries` pelo suporte a `jsPlugins` do oxlint, com as regras da tabela do `00-requirements.md` 3.4 (exceção: View importa `model/*.schema.ts`).
- `@sentry/react` em `shared/lib/sentry.ts`, `ErrorBoundary` no `__root`, `tanstackRouterBrowserTracingIntegration(router)`, wrapper `shared/lib/monitoring.ts` para os ViewModels. Desligado sem DSN.

## Fora do escopo
Observabilidade do backend (já feita no BE-16).

## Referências
- `plans/[complete]-core-product/00-requirements.md` 3.4 e seção de observabilidade

## Checklist
- [x] Lint quebra ao importar store ou service numa View
- [x] Sentry desligado sem DSN
- [x] Commit

## Critério de aceite
`npm run lint` falha numa violação de camada criada de propósito e passa no código atual.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com o outro ticket da onda (FE-10 e FE-13), na branch `feature/web-routing`. Os dois pararam no meio pelo limite de uso da API e foram retomados. Revisado pelo Opus: web 1105 testes, api 282, lint e typecheck verdes.

- `eslint-plugin-boundaries` 7.3 roda dentro do oxlint pelos `jsPlugins` (sem fallback), regra `boundaries/dependencies` com tudo proibido por padrão e uma política por camada; aliases `@/` resolvidos pelo `eslint-import-resolver-typescript`. Specs, `test/`, stories e fixtures ficam de fora.
- Views também têm `no-restricted-imports` para router, query, zustand, axios, socket.io e Sentry.
- Para cumprir as regras: 26 tipos de dados das Views foram para `model/entities`, `ImageError` e `LanguageOption` para `shared/lib`, as constantes de seções e abas para `*.constants.ts` (os `*.search.ts` reexportam).
- Sentry 11.9: `initSentry(router)` no `app.tsx`, desligado sem `VITE_SENTRY_DSN`; tracing do TanStack Router, propagação só para `/api`, replay mascarando texto e mídia só em erro; `beforeSend` remove cookies, headers de auth e dados do usuário menos o id. `ErrorBoundary` no `RootLayout` com fallback traduzido. `shared/lib/monitoring.ts` para os ViewModels; usuário setado no layout logado e limpo no sign-out. `.env.example` criado.
- Cypress 26 de 26 depois das mudanças.

Suposições *(confirmar)*:
- Views podem importar tipos do Model (`import type`), além dos schemas. *(suposição)*
- `*.constants.ts` é uma categoria nova do Model que Views, Screens, rotas e ViewModels podem importar. *(suposição)*
- Amostragem de traces 1,0 em dev e 0,1 em produção. *(suposição)*
- Release em `VITE_SENTRY_RELEASE`; source maps (`@sentry/vite-plugin`) ficaram de fora. *(suposição)*
