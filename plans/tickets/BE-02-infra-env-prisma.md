# BE-02 · Postgres local, env validado, Prisma 7, logs e base dos testes e2e

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: BE-01 · Onda 2 · **Status: concluído em 2026-10-24**

## Contexto
O banco é **PostgreSQL com Prisma 7** (driver adapter `@prisma/adapter-pg`, `prisma.config.ts`). Localmente o Postgres roda em container. A configuração da API é validada com zod na inicialização e falha cedo.

## Escopo
- `infra/docker-compose.dev.yml` só com o `postgres` por enquanto, com volume e healthcheck. nginx, web, api e cloudflared entram depois.
- `src/env/`: schema zod do `process.env` e `EnvService` tipado. Variáveis iniciais: `NODE_ENV`, `PORT`, `DATABASE_URL`, `LOG_LEVEL`. `.env.example` na API.
- Prisma 7:
  - `prisma.config.ts` e `prisma/schema/schema.prisma` (generator `prisma-client` com saída em `src/generated/prisma`, formato CJS, e datasource);
  - `PrismaService` em `src/lib/prisma.ts` com o adapter pg e encerramento limpo;
  - `src/generated` no `.gitignore`;
  - scripts `db:migrate`, `db:generate`, `db:studio`;
  - `postinstall` ou `prebuild` gerando o client.
- Logger pino (`nestjs-pino`) em JSON, com id de requisição e `pino-pretty` em dev.
- Healthcheck `GET /api/health` com checagem do banco, e prefixo global `/api`.
- Base dos e2e: Postgres de teste (schema ou banco separado), migrations aplicadas antes da suíte, limpeza entre testes e `test/factories/` com um helper inicial.

## Fora do escopo
Modelos de domínio (cada ticket cria os seus), Better Auth, OpenTelemetry (BE-16).

## Referências
- `plans/04-tech-plan.md` seção 1 (configuração, observabilidade, testes)
- `plans/00-requirements.md` 3.3 e 4

## Checklist
- [x] Consultar a documentação atual do Prisma 7 (Context7): `prisma.config.ts`, generator `prisma-client`, adapter pg, multi-file schema
- [x] Compose com Postgres e healthcheck
- [x] `EnvService` com testes unitários do schema (variável faltando derruba a inicialização)
- [x] `PrismaService` e primeira migration vazia
- [x] Logger pino configurado
- [x] `/api/health` com teste e2e (banco ok e banco fora)
- [x] Harness e2e com Postgres de teste
- [x] Documentar em `apps/api/README.md` como subir o banco e rodar os testes
- [x] Commit a cada passo verde

## Critério de aceite
`docker compose -f infra/docker-compose.dev.yml up -d`, `npm run db:migrate` e `npm run dev` sobem a API. `GET /api/health` responde 200, e a suíte e2e roda contra o Postgres de teste.

## Notas da execução
- Postgres 18 (alpine) no compose; o script `infra/postgres/init` cria o banco `gameplay_test` na primeira subida do volume.
- `@nestjs/config` com `validate` do zod (`src/env/env.schema.ts`); `EnvService` tipado por cima do `ConfigService`.
- `prisma.config.ts` lê `DATABASE_URL` sem exigir: o `prisma generate` precisa rodar sem banco (Docker, CI, `postinstall`).
- Ainda não há migration: o Prisma não cria migration sem modelos. A primeira vem no BE-04 com as tabelas do Better Auth.
- Healthcheck como use-case (`CheckHealthUseCase`) e controller, no módulo `health`; o request do healthcheck não é logado.
- `setupApp` (`src/app.setup.ts`) é usado pelo `main.ts` e pelo `createTestApp` dos e2e, para os testes rodarem com a mesma configuração.
- **Adicionado a pedido do usuário:** imagem Docker de produção (`apps/api/Dockerfile`, multi-stage com `turbo prune`) e serviço `api` no compose, que sobe junto do Postgres na porta 3334 enquanto o `npm run dev` roda na máquina na 3333 (`npm run docker:api` refaz a imagem). Runtime instala sem `optional` para não trazer o Prisma CLI, Studio, TypeScript e React (imagem de 737 MB para 413 MB; API usa ~74 MB de RAM). Rever no BE-07 por causa dos pacotes opcionais do `sharp`.
- Migrations ainda não rodam no container; fica para quando houver deploy (CI ou entrypoint).
- O npm tinha deixado `@nestjs/core` na raiz e `@nestjs/platform-express` dentro de `apps/api`, e a API falhava em produção ("No driver (HTTP)"). Reinstalar os dois corrigiu.
