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
- `plans/00-requirements.md` 3.4 e seção de observabilidade

## Checklist
- [ ] Lint quebra ao importar store ou service numa View
- [ ] Sentry desligado sem DSN
- [ ] Commit

## Critério de aceite
`npm run lint` falha numa violação de camada criada de propósito e passa no código atual.
