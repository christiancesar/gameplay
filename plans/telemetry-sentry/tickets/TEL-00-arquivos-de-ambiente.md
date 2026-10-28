# TEL-00 Arquivos de ambiente por aplicação

Feito na branch `feature/desktop-app` (PR #26), junto com o desktop, a pedido do usuário.

## Escopo
- Self-hosted: o `.env` único vira `.env` (host), `.env.api` (container da API) e `.env.web` (imagem do web), cada um com o seu `*.example`.
- O CLI (`npm run host:*`) lê os três como um só (`--env-file` repetido), cria cada um a partir do exemplo e migra um `.env` antigo, mantendo todos os valores.
- Desktop: `apps/desktop/.env` e `.env.example` (DSN do projeto do Electron e variáveis dos source maps).

## Fora do escopo
- `infra/production`, que continua com um `.env` só.

## Checklist
- [x] `.env.api` e `.env.web` e os exemplos; `.gitignore` cobre `.env.*` e libera `*.example`
- [x] `cli/env-layout.ts` (tipado pelo schema), `cli/host-env.ts` e migração em `setup-env.ts`
- [x] `docker compose config` idêntico, linha por linha, ao de antes, sobre uma cópia do `.env` real
- [x] Specs do CLI (23 testes), typecheck, lint e formatação
- [x] README do self-hosted e `AGENTS.md`

## Notas da execução
- Cada variável fica no arquivo que a usa; as que mais de um serviço lê ficam no `.env`: `POSTGRES_PASSWORD`, `APP_URL`, `OTEL_DEPLOYMENT_ENVIRONMENT`. *(suposição)* o `OTEL_DEPLOYMENT_ENVIRONMENT` fica no host por alimentar o Grafana e o Sentry do web.
- *(suposição)* variáveis que o schema não conhece ficam no `.env` do host.
- Rodar `docker compose` na mão exige os três `--env-file`; está no README.
- `SENTRY_PROJECT` e `SENTRY_PROJECT_ID` do `apps/desktop/.env` são os do projeto do Electron (`gameplay-electron`, `4512331486920704`); os do web seguem em `.env.web` (`gameplay-project-sentry`, `4512302614052864`). A organização é a mesma (`christian-cesar`).
