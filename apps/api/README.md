# api

Backend do Gameplay: NestJS 11 com Express, Prisma 7 e Postgres.

## Rodando local

```bash
# na raiz do repo: Postgres (cria também o banco gameplay_test)
docker compose -f infra/docker-compose.dev.yml up -d --wait

# em apps/api
cp .env.example .env      # só na primeira vez
npm run db:migrate        # aplica as migrations no banco de dev
npm run dev               # http://localhost:3333/api/health
```

## Build em Docker

O compose sobe, junto do Postgres, a imagem de produção da API (`apps/api/Dockerfile`, contexto na raiz). Ela roda ao lado do `npm run dev`:

|                         | Porta | Origem                              |
| ----------------------- | ----- | ----------------------------------- |
| `npm run dev` (máquina) | 3333  | código fonte, watch                 |
| container `api`         | 3334  | imagem de produção (build completo) |

```bash
npm run docker:api        # na raiz: refaz a imagem e sobe postgres + api
```

Os dois usam o mesmo banco de dev. As migrations ainda não rodam dentro do container: aplique com `npm run db:deploy` apontando para o banco.

## Scripts

| Script                                        | O que faz                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `dev`                                         | sobe a API em modo watch                                                                                             |
| `build` / `start`                             | compila para `dist/` e roda o build                                                                                  |
| `typecheck`, `lint`, `format`, `format:check` | checagens                                                                                                            |
| `test`                                        | testes unitários (`src/**/*.spec.ts`)                                                                                |
| `test:e2e`                                    | testes e2e (`test/e2e`) contra o banco `gameplay_test`; aplica as migrations antes. Outro banco: `TEST_DATABASE_URL` |
| `db:generate`                                 | gera o Prisma Client em `src/generated/prisma` (roda também no `postinstall`)                                        |
| `db:migrate`                                  | cria e aplica migrations em dev                                                                                      |
| `db:deploy`                                   | aplica migrations pendentes (CI, produção)                                                                           |
| `db:studio`                                   | abre o Prisma Studio                                                                                                 |

## Variáveis de ambiente

Validadas com zod na inicialização (`src/env/env.schema.ts`); a API não sobe com variável faltando ou inválida. Ver `.env.example`.
