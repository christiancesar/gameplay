# BE-02 · Postgres local, env validado, Prisma 7, logs e base dos testes e2e

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: BE-01 · Onda 2

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
- [ ] Consultar a documentação atual do Prisma 7 (Context7): `prisma.config.ts`, generator `prisma-client`, adapter pg, multi-file schema
- [ ] Compose com Postgres e healthcheck
- [ ] `EnvService` com testes unitários do schema (variável faltando derruba a inicialização)
- [ ] `PrismaService` e primeira migration vazia
- [ ] Logger pino configurado
- [ ] `/api/health` com teste e2e (banco ok e banco fora)
- [ ] Harness e2e com Postgres de teste
- [ ] Documentar em `apps/api/README.md` como subir o banco e rodar os testes
- [ ] Commit a cada passo verde

## Critério de aceite
`docker compose -f infra/docker-compose.dev.yml up -d`, `npm run db:migrate` e `npm run dev` sobem a API. `GET /api/health` responde 200, e a suíte e2e roda contra o Postgres de teste.
