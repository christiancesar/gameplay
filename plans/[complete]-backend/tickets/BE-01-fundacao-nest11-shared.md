# BE-01 · Refazer o scaffold em NestJS 11 e criar o `packages/contracts`

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: nenhum · Onda 1 · **Status: concluído em 2026-10-24**

## Contexto
O scaffold atual de `apps/api` está em NestJS 12 (ESM). O usuário decidiu ir de **NestJS 11**, porque o `nestjs-asyncapi` e o `nestjs-zod` ainda não aceitam o 12. O `packages/contracts` guarda os schemas zod e os tipos de eventos usados pela API e pelo web.

## Escopo
- Refazer `apps/api` com o template do `@nestjs/cli@11` (CommonJS), mantendo as convenções atuais:
  - scripts `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `test:e2e`, `format`, `format:check`;
  - oxlint `--type-aware` e oxfmt com a mesma config do web;
  - Vitest com unit em `src/**/*.spec.ts` e e2e em `test/e2e/`;
  - `AppModule` vazio e as pastas vazias de `src/` (`@types`, `env`, `lib`, `common`, `modules`), `prisma/schema` e `test/factories`.
- Criar `packages/contracts`:
  - `package.json` com nome `@gameplay/contracts`, ESM, `exports` apontando para `dist`, dependência `zod` na mesma versão do web;
  - `tsconfig` com `declaration`, build com `tsc`;
  - scripts `build`, `dev` (`tsc --watch`), `typecheck`, `lint`, `format`;
  - `src/index.ts` exportando a regra de username (`USERNAME_PATTERN` e `usernameSchema`, sem mensagens; o web acrescenta as mensagens de i18n).
- A API e o web declaram `@gameplay/contracts` como dependência do workspace.
- Turbo: o `build` do shared roda antes do `typecheck`, `build` e `test` dos apps (já coberto pelo `^build`; conferir).
- Ajustar o warning do turbo sobre `outputs` da tarefa `test`.

## Fora do escopo
Qualquer módulo, rota, Prisma, auth ou socket.

## Referências
- `plans/[complete]-backend/04-tech-plan.md` seção 1 (contrato compartilhado)
- `plans/[complete]-core-product/00-requirements.md` 3.2, 3.3 e 3.3.1

## Checklist
- [x] Gerar o template do Nest 11 no scratchpad e comparar com o `apps/api` atual
- [x] Substituir `apps/api` (package.json, tsconfig, nest-cli, vitest configs, main, app.module)
- [x] Confirmar que `require` de um pacote ESM funciona no Node 24 a partir da API em CJS (importar `@gameplay/contracts` no `main.ts` temporariamente)
- [x] Criar `packages/contracts` com build, typecheck, lint e format
- [x] Importar o schema de exemplo no web e na API, e conferir typecheck dos dois
- [x] `npm run build`, `typecheck`, `lint`, `test` e `format:check` verdes na raiz
- [x] Teste e2e de boot verde
- [x] Atualizar `plans/PROGRESS.md` (seção Backend)
- [x] Commit

## Critério de aceite
`npx turbo run build typecheck lint test` verde na raiz, a API sobe com `node dist/main` e importa o `@gameplay/contracts`.

## Notas da execução
- A API em CommonJS importa o `@gameplay/contracts` (ESM) via `require(esm)` do Node 24; o TypeScript 6 aceita com `module: nodenext`. Testado com typecheck, build e execução.
- O shared exporta a regra real de username em vez de um schema descartável, para não ter código de exemplo para remover depois.
- Turbo: `test` sem `outputs` (o warning sumiu) e `dev` depende do `^build`, para o web e a API acharem o `dist` do shared já na primeira subida.
