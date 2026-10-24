# BE-01 · Refazer o scaffold em NestJS 11 e criar o `packages/shared`

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: nenhum · Onda 1

## Contexto
O scaffold atual de `apps/api` está em NestJS 12 (ESM). O usuário decidiu ir de **NestJS 11**, porque o `nestjs-asyncapi` e o `nestjs-zod` ainda não aceitam o 12. O `packages/shared` guarda os schemas zod e os tipos de eventos usados pela API e pelo web.

## Escopo
- Refazer `apps/api` com o template do `@nestjs/cli@11` (CommonJS), mantendo as convenções atuais:
  - scripts `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `test:e2e`, `format`, `format:check`;
  - oxlint `--type-aware` e oxfmt com a mesma config do web;
  - Vitest com unit em `src/**/*.spec.ts` e e2e em `test/e2e/`;
  - `AppModule` vazio e as pastas vazias de `src/` (`@types`, `env`, `lib`, `common`, `modules`), `prisma/schema` e `test/factories`.
- Criar `packages/shared`:
  - `package.json` com nome `@gameplay/shared`, ESM, `exports` apontando para `dist`, dependência `zod` na mesma versão do web;
  - `tsconfig` com `declaration`, build com `tsc`;
  - scripts `build`, `dev` (`tsc --watch`), `typecheck`, `lint`, `format`;
  - `src/index.ts` exportando um schema de exemplo, removido no BE-03.
- A API e o web declaram `@gameplay/shared` como dependência do workspace.
- Turbo: o `build` do shared roda antes do `typecheck`, `build` e `test` dos apps (já coberto pelo `^build`; conferir).
- Ajustar o warning do turbo sobre `outputs` da tarefa `test`.

## Fora do escopo
Qualquer módulo, rota, Prisma, auth ou socket.

## Referências
- `plans/04-tech-plan.md` seção 1 (contrato compartilhado)
- `plans/00-requirements.md` 3.2, 3.3 e 3.3.1

## Checklist
- [ ] Gerar o template do Nest 11 no scratchpad e comparar com o `apps/api` atual
- [ ] Substituir `apps/api` (package.json, tsconfig, nest-cli, vitest configs, main, app.module)
- [ ] Confirmar que `require` de um pacote ESM funciona no Node 24 a partir da API em CJS (importar `@gameplay/shared` no `main.ts` temporariamente)
- [ ] Criar `packages/shared` com build, typecheck, lint e format
- [ ] Importar o schema de exemplo no web e na API, e conferir typecheck dos dois
- [ ] `npm run build`, `typecheck`, `lint`, `test` e `format:check` verdes na raiz
- [ ] Teste e2e de boot verde
- [ ] Atualizar `plans/PROGRESS.md` (seção Backend)
- [ ] Commit

## Critério de aceite
`npx turbo run build typecheck lint test` verde na raiz, a API sobe com `node dist/main` e importa o `@gameplay/shared`.
