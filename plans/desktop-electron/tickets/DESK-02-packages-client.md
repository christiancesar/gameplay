# DESK-02 · Front-end em `packages/client`

> Pontos: 8 · Depende de: DESK-01 · Branch `feature/desktop-client-package`, saída da `dev`

## Contexto
Plano em `../02-tech-plan.md` (decisões, arquitetura e source tree alvo, seção 5). O app desktop vai rodar o mesmo front-end do web. Para isso o código de `apps/web/src` sai do app e vira o pacote `@gameplay/client`, consumido pelo web agora e pelo desktop no DESK-05.

## Escopo
- Criar `packages/client` (`@gameplay/client`) e mover para ele, com `git mv` para manter o histórico: `src/app` (com `routes/` e `route-tree.gen.ts`), `src/modules`, `src/shared`, `src/fixtures`, `src/docs` e o tema que hoje está no `index.css`.
- O pacote exporta o código-fonte, sem build: o Vite de cada casca compila o TypeScript dele.
- `apps/web` vira casca: `main.tsx` montando o `App` do pacote, `index.css` importando o tema e com `@source` para o pacote, `index.html`, `vite.config.ts` (React, Tailwind, router plugin com `routesDirectory` e `generatedRouteTree` no pacote, Sentry, proxy de `/api`).
- Storybook e Vitest (projetos `unit` e `storybook`) vão para o pacote. `npm run storybook` e `npm test` na raiz continuam funcionando.
- `components.json` do shadcn passa a apontar para o pacote.
- Aliases: o `@/` de hoje passa a resolver para `packages/client/src` nos dois lados (pacote e casca), sem reescrever imports.
- `oxlint` e `oxfmt` com a configuração do web levada para o pacote.
- `apps/web/Dockerfile` copia `packages/client`; o build do web no self-hosted e no deploy de produção continua igual.
- Cypress continua em `apps/web`, rodando contra o web.
- Docs: `AGENTS.md` e `plans/05-web-plan.md` passam a dizer `packages/client/src/modules/...` onde hoje dizem `apps/web/src`.

## Fora do escopo
Porta `Platform` (DESK-03). Servidor em tempo de execução e token (DESK-04). `apps/desktop` (DESK-05). Qualquer mudança de comportamento ou de UI.

## Checklist
- [ ] `packages/client` com `package.json`, `tsconfig`, Vitest e Storybook
- [ ] Código movido com `git mv`, imports `@/` resolvendo
- [ ] `apps/web` como casca, `npm run dev` e `npm run build` iguais
- [ ] Router plugin gerando as rotas no pacote
- [ ] Tailwind enxergando o pacote (estilos iguais, conferidos no Storybook e no web)
- [ ] shadcn adicionando componentes no pacote
- [ ] Dockerfile do web buildando (`docker build -f apps/web/Dockerfile .`)
- [ ] Cypress verde
- [ ] Typecheck, lint, format e testes na raiz
- [ ] Docs atualizadas
- [ ] Commit a cada passo verde

## Checklist de validação
Rodar e colar o resultado nas notas da execução:
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` e `npm test` na raiz, todos verdes, com o mesmo número de testes de antes (web hoje: contar antes de mover)
- [ ] Storybook: `npm run storybook` abre e os testes das stories (projeto `storybook` do Vitest) passam
- [ ] `npm run build -w web` gera o `dist/` e `npm run dev` serve o app em `localhost:5173` com login funcionando contra a API local
- [ ] `git diff --stat dev` mostra os arquivos como renomeados (R), não apagados e criados
- [ ] `grep -rn "apps/" packages/client/src` sem resultado de import
- [ ] `docker build -f apps/web/Dockerfile .` termina sem erro
- [ ] Cypress (`npm run e2e -w web`) verde, ou anotado nas notas se a stack não pôde subir

## Critério de aceite
O web funciona exatamente como antes, todos os testes e stories passam, e nada em `packages/client` importa de `apps/*`.
