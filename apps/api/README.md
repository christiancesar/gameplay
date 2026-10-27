# api

Backend do Gameplay: NestJS 11 com Express, Prisma 7 e Postgres.

## Rodando local

```bash
# na raiz do repo: Postgres do self-hosted em 127.0.0.1:5433 (cria também o banco gameplay_test)
npm run host:db

# em apps/api
cp .env.example .env      # só na primeira vez; senha do DATABASE_URL = POSTGRES_PASSWORD de infra/self-hosted/.env
npm run db:migrate        # aplica as migrations no banco de dev
npm run dev               # http://localhost:3333/api/health
```

## Build em Docker

A imagem de produção da API (`apps/api/Dockerfile`, contexto na raiz) roda na stack self-hosted (`npm run host:start`, veja `infra/self-hosted/README.md`), que simula a produção.

## Scripts

| Script                                        | O que faz                                                                                                                                             |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`                                         | sobe a API em modo watch                                                                                                                              |
| `build` / `start`                             | compila para `dist/` e roda o build                                                                                                                   |
| `typecheck`, `lint`, `format`, `format:check` | checagens                                                                                                                                             |
| `test`                                        | testes unitários (`src/**/*.spec.ts`)                                                                                                                 |
| `test:e2e`                                    | testes e2e (`test/e2e`) contra o banco `gameplay_test` do servidor do `DATABASE_URL`; aplica as migrations antes. Outro endereço: `TEST_DATABASE_URL` |
| `db:generate`                                 | gera o Prisma Client em `src/generated/prisma` (roda também no `postinstall`)                                                                         |
| `db:migrate`                                  | cria e aplica migrations em dev                                                                                                                       |
| `db:deploy`                                   | aplica migrations pendentes (CI, produção)                                                                                                            |
| `db:studio`                                   | abre o Prisma Studio                                                                                                                                  |

## Autenticação

Better Auth em `/api/auth/*` (cadastro, login por email ou username, sessão, 2FA). Toda rota da API exige sessão, exceto as marcadas com `@AllowAnonymous()`. Rotas do admin da plataforma usam `@PlatformAdmin()` (papel `admin` com 2FA ligado).

Criar o admin da plataforma:

```bash
ADMIN_EMAIL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run seed:admin
```

## Documentação

Com a API em dev: http://localhost:3333/api/docs (Scalar). O seletor no topo troca entre REST (OpenAPI) e os eventos do Socket.IO (AsyncAPI). Desligada em produção; `DOCS_ENABLED=true|false` força.

## Variáveis de ambiente

Validadas com zod na inicialização (`src/env/env.schema.ts`); a API não sobe com variável faltando ou inválida. Ver `.env.example`.

## Uploads

`STORAGE_DRIVER=local` (padrão) grava em `STORAGE_LOCAL_DIR` (`./uploads`). Fora de produção a própria API serve esses arquivos em `PUBLIC_UPLOADS_URL` (`/uploads`); em produção quem serve é o nginx. Com `STORAGE_DRIVER=s3`, os arquivos vão para um bucket compatível com S3 (AWS, R2) e `PUBLIC_UPLOADS_URL` é a URL pública do bucket ou do CDN. Variáveis em `.env.example`.

O banco guarda só a chave (exemplo: `avatars/<userId>/<hash>.webp`); a URL pública é montada na hora.

## Observabilidade

Com `OTEL_EXPORTER_OTLP_ENDPOINT` definido, a API manda traces, métricas e logs por OTLP (Grafana Cloud), com spans de HTTP, Express, Nest, Prisma e pg. Cada linha do pino ganha `trace_id` e `span_id`. Sem a variável, nada liga. O SDK sobe em `src/lib/otel.ts`, carregado pela primeira linha do `main.ts`; os testes nunca o iniciam. Variáveis em `.env.example`.
