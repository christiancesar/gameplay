# Progresso do planejamento

> Última atualização: 2026-10-27 (SFU-01, SFU-05, SFU-04 e SFU-02 concluídos na `feature/sfu`; próximo: SFU-03).

## Status das fases (workflow ágil)

| Fase | Arquivo | Status |
|---|---|---|
| 00 · Levantamento | `00-requirements.md` | Concluída |
| 01 · Epic Brief | `01-epic-brief.md` | Rascunho entregue, sem objeções |
| 02 · Core Flows | `02-core-flows.md` | Concluída para as telas com mock; F7 a F13 terão o visual desenhado no Storybook |
| 03 · PRD Validate | | Não iniciada |
| 04 · Tech Plan | `04-tech-plan.md` | Rascunho do backend entregue, aguardando revisão do usuário |
| Tickets e delegação | `tickets/` | Backend BE-01 a BE-17 e frontend FE-01 a FE-14b concluídos |
| 05 · Plano do frontend | `05-web-plan.md` | Escrito em 2026-10-25, ferramentas e árvore de rotas em `src/app/` |

## Próxima sessão

O usuário decidiu ir **direto para o Storybook**, antes de PRD Validate e Tech Plan. O Storybook passa a ser onde o visual dos fluxos sem mock é desenhado e validado.

Escopo mínimo para começar:
1. ~~`git init` e branch de trabalho~~. Feito: repo com branch `chore/monorepo-setup` (sem commits ainda).
2. ~~Monorepo npm workspaces + Turborepo com `apps/web`~~. Feito: Vite 8, React 19, TS 6, Tailwind 4, shadcn (radix, preset nova) com componentes em `src/shared/ui`.
3. ~~Storybook com interaction tests~~. Feito: Storybook 10 + `@storybook/addon-vitest` (Chromium headless via Playwright). `npm test` roda as play functions.
4. ~~Tema claro/escuro e EN/PT~~. Feito na infra: toolbar de tema (padrão escuro) e de idioma no Storybook; i18next em `src/shared/i18n`. Paleta: **neutral padrão do shadcn** (decisão do usuário), com cores do Tailwind para destaques (`emerald` para transmitir, `red` para sair da sala).
5. **Todas as Views dos fluxos F1 a F13 estão no Storybook**, com stories de todos os estados e interaction tests (157 testes). A página "Introdução" do Storybook liga cada fluxo às stories.

Próximo passo sugerido: o usuário revisar o visual no Storybook (`npm run storybook`, porta 6006) e depois seguir para `/prd-validate` e `/tech-plan`. ViewModels, Screens e rotas ainda não existem.

## SFU, retomar daqui

- 2026-10-27: branch `dev` criada; toda branch sai da `dev` e volta por PR para ela, e a `main` só recebe PR da `dev` (protegida no GitHub, só entra por PR).
- 2026-10-27: tela pelo Cloudflare Realtime SFU por padrão, com o mesh como opção no diálogo de compartilhar; voz em mesh; sem RealtimeKit; um app do SFU só para desenvolvimento e produção. Desenho em `media-transport-options.md` seção 7.
- Variáveis `CLOUDFLARE_SFU_APP_ID` e `CLOUDFLARE_SFU_APP_TOKEN` criadas nos `.env.example`, no schema da API, nos composes e no `deploy.sh` (branch `feature/sfu`). Os valores ficam com o usuário.
- Tickets SFU-01 a SFU-05 escritos (`tickets/README.md`, seção SFU). Ordem: SFU-01, SFU-05, SFU-04, SFU-02, SFU-03. Aprovados pelo usuário em 2026-10-27: nomes e explicações dos modos, queda para Direto, aba Mídia com SFU, Mesh e TURN globais e por servidor, desligar derruba, aviso da plataforma, correção do campo numérico no SFU-04. SFU-01, SFU-05, SFU-04 e SFU-02 concluídos (notas nos tickets), aguardando review. Transmissão pelo SFU testada com a Cloudflare de verdade (dois browsers headless). Providers da API reorganizados por recurso e implementação (`04-tech-plan.md`). Próximo: SFU-03.

## Frontend (`apps/web`), retomar daqui

- 2026-10-25: PRs #2 e #3 mergeados na `main`; branches locais apagadas.
- Plano em `05-web-plan.md` e tickets `tickets/FE-01` a `FE-14` (índice e grafo em `tickets/README.md`). Nada foi instalado ainda.
- Decisões do usuário: rotas em `src/app/routes` (TanStack Router por arquivo); sala de voz fora da URL (store de voz, `?watch=` para assistir); modais por search param (`?settings=`, `?serverSettings=`); abas do admin como rotas filhas.
- O usuário não tem tokens para construir o frontend inteiro numa sessão: executar um ticket por vez e combinar a branch antes.
- A implementação segue no **OpenCode** (decisão do usuário em 2026-10-25), guiada pelo `AGENTS.md`. O **FE-01 está pela metade** na branch `docs/web-plan`: o que foi feito e o que falta estão nas notas do ticket.
- 2026-10-25 (tarde): de volta ao Claude Code, com Opus orquestrando e Sonnet/Haiku implementando. Review do que o OpenCode fez, correções e **FE-01 e FE-02 concluídos** na branch `feature/web-routing` (sem push, sem PR ainda). Correções do review e suposições nas notas dos dois tickets. **Aguardando review do usuário.** Próximos liberados: FE-05 (socket), FE-13 (lint MVVM e Sentry), FE-03, FE-04, FE-08 e FE-11.
- 2026-10-25: **FE-03 (Hub) e FE-05 (socket) concluídos** em paralelo, mesma branch. Suíte web com 412 testes. Ponto aberto para o usuário: a API não expõe o limite efetivo de servidores para o usuário comum (ver notas do FE-03). Liberados agora: FE-04, FE-06, FE-08, FE-11, FE-12 e FE-13.
- 2026-10-25: **FE-04, FE-06, FE-08 e FE-11 concluídos** em paralelo (quatro agentes Sonnet). Suíte web com 694 testes, api 271. Teste headless (Playwright) contra a API local: login, Hub, configurações, setup do 2FA, convite inválido e tela do servidor sem erros no console. O Vite do usuário que roda desde as 09:42 ficou com cache velho (página branca, `RootLayout` não encontrado); reiniciar o `npm run dev` resolve.
- Pontos abertos na API, para o usuário decidir (detalhes nas notas do FE-03, FE-04 e FE-11):
  1. Limite efetivo de servidores para o usuário comum (o card de criar não sabe quando bloquear).
  2. GET dos limites próprios de usuário e servidor no admin: hoje salvar o diálogo depois de recarregar zera o limite existente. **O mais urgente.**
  3. `POST /invites/:code/join` com auto aprovação não barra servidor cheio.
  4. Encerrar uma sessão só, última atividade da sessão, contagem de pedidos pendentes e listagem global de dispositivos (melhorias, não bloqueiam).
- 2026-10-25: a pedido do usuário, **BE-17** fechou as lacunas da API (limite do usuário, limites próprios no admin, encerrar uma sessão, última atividade, contagem de pedidos, listagem global de dispositivos) e o web trocou os contornos pelos dados novos. O item "convite em servidor cheio" não era lacuna: com aprovação automática e servidor cheio já vira pedido pendente.
- 2026-10-25: Cypress é o e2e principal (Playwright só para conferência rápida do orquestrador, fora do repo). FE-14 dividido: **FE-14a concluído** (26 cenários, `npm run e2e` com API e Vite de pé, dados com prefixo apagados no fim); FE-14b (peer bot, voz e transmissão) fica para depois do FE-09 e FE-10.
- Estado: web 694 testes, api 282 unitários e 148 e2e, Cypress 26. Liberados agora: FE-07 (modal do servidor), FE-09 (voz), FE-12 (avisos do ambiente) e FE-13 (lint MVVM e Sentry).
- 2026-10-25: **FE-07 (modal do servidor), FE-09 (voz) e FE-12 (avisos do ambiente) concluídos** em paralelo. Voz testada com dois Chromium headless: conectam e trocam áudio. Estado: web 975 testes, api 282, Cypress 26. Faltam FE-10 (transmissão), FE-13 (lint MVVM e Sentry) e FE-14b (e2e de voz com peer bot).
- 2026-10-25: **FE-10 (transmissão) e FE-13 (lint MVVM e Sentry) concluídos.** Transmissão testada com dois Chromium headless: quem assiste recebe vídeo. As camadas do MVVM agora são checadas pelo lint. Sentry desligado até haver DSN. Estado: web 1105 testes, api 282. Falta só o FE-14b (e2e de voz e transmissão com peer bot). A escolha de prioridade na transmissão foi adicionada logo depois (web 1110 testes, Cypress 26).
- 2026-10-25: **FE-14b concluído**: Cypress com peer bot para voz e transmissão, 35 cenários, 3 execuções seguidas sem falha. **Todos os tickets do frontend (FE-01 a FE-14) e do backend (BE-01 a BE-17) estão concluídos** na branch `feature/web-routing`, sem push e sem PR. Corrigido também o proxy de `/uploads` no Vite (avatar não carregava em dev).
- 2026-10-25: **servidor na máquina do usuário** (Fase 1): `infra/self-hosted/` com Postgres, migração e seed do admin, API, web no nginx e cloudflared, separado do banco de dev. Túnel fixo `gameplay` (id `98fc40f2…`) criado na conta Cloudflare do usuário, com DNS `gameplay.oikos.company`; o túnel antigo `oikos-local-dev` e o `~/.cloudflared/config.yml` não foram alterados. TURN do Cloudflare Realtime configurado (`ICE_PROVIDER=cloudflare`). Conferido pelo domínio: página, `/api/health`, login, WebSocket e `/api/ice` com 6 URLs de TURN. Comandos: `npm run host:start`, `host:stop`, `host:logs`; guia em `infra/self-hosted/README.md`.
- 2026-10-26: overlay da transmissão no celular deitado e volta para a call depois do reload conferidos pelo usuário no celular, pelo domínio. `feature/web-routing` encerrada e enviada em PR para a `main`.
- Lacunas fora dos tickets (levantadas em 2026-10-26): não há CI (`.github/workflows`), não há infra de produção (Fase 2 na AWS, sob `oikos.company`, fica para depois; o TURN continua o da Cloudflare, não coturn), não há backup agendado do Postgres do host, e a telemetria está desligada no host (`OTEL_*` e `VITE_SENTRY_DSN` vazios em `infra/self-hosted/.env`).
- Próximo foco escolhido pelo usuário: **observabilidade** (Grafana para API e websocket, Sentry no web).
- 2026-10-26: **FE-15 concluído** na branch `fix/screen-share-audio`: áudio da tela sem chegar numa transmissão feita pelo Firefox (causa provável, não confirmada). Suporte de áudio por browser e sistema (switch travado onde o áudio da tela não vem, avisando que só o microfone vai), aviso quando o áudio não vem, indicador de som no painel, medida `screen_share_start` no Faro e, para quem assiste, resolução, fps e bitrate recebidos. Atenção: o PR #5 (observabilidade) foi mergeado na `feature/web-routing`, não na `main`; esta branch inclui esse trabalho. Sem push e sem PR, aguardando review. Na mesma branch: tela cheia da live sem os controles nativos (não pausa mais) e o user card e o Hub mostrando o username em vez do `name` do cadastro.
- 2026-10-26: **FE-16 concluído** na mesma branch: player imersivo da live (vídeo na tela toda com controles por cima), tela cheia real no desktop e Android, imersivo automático no celular deitado. Falta a conferência do usuário no iPhone pelo host.
- 2026-10-26: **planejamento de produção** em `06-producao-aws.md` (só plano e preço, nada implementado): API no Lightsail em us-east-1, banco no Prisma Postgres, web no Cloudflare Workers, uploads no R2, voz com TURN e tela com o **Cloudflare Realtime SFU, agora requisito**. Estimativa de ~US$ 23 a 25/mês para o grupo pequeno. Tickets propostos INF-01 a INF-05, SFU-01 a SFU-03 e DESK-01, ainda não criados.
- 2026-10-26: **túnel `gameplay` removido** a pedido do usuário (túnel `98fc40f2…` apagado na Cloudflare e registro DNS `gameplay.oikos.company` apagado), para o nome ficar livre para o web de produção no Workers. O `infra/self-hosted` voltou para o modo `quick`; um nome fixo para ele fica para depois. O túnel `oikos-local-dev` não foi tocado.
- Decisão futura do usuário (2026-10-26): usar **Electron** para capturar o áudio por processo (o jogo isolado), o que o browser não permite. Até lá a transmissão leva só o áudio de aba, ou o do sistema na tela inteira do Windows.
- 2026-10-26: branch `feature/observability`, tickets OBS-01 a OBS-06 (`tickets/README.md`). **OBS-01 concluído**: API do host mandando logs, traces e métricas ao Grafana Cloud com `deployment.environment.name=host`, conferido pela API de consulta (token de leitura e URLs de Loki, Tempo e Prometheus no `.env` da raiz). **OBS-06 concluído**: `/api/health/details` público (banco, storage e TURN), base para uma página de status no futuro; ainda não aplicado no host. Pendentes: OBS-02 (Sentry, aguarda DSN e token), OBS-03 (realtime na API), OBS-04 (Faro, aguarda URL do coletor), OBS-05 (dashboards e alertas).
- 2026-10-26 (tarde): **OBS-02** (Sentry só para erros, source maps no build, tunnel `/monitoring/sentry` no nginx porque o Brave bloqueia o sentry.io) e **OBS-03** (métricas `gameplay_realtime_*` e `gameplay_voice_*`, runtime do Node, logs de sala e transmissão) concluídos e no host. Documentação da API pública em `/api/docs` (gerada no build da imagem). Falta: OBS-04 (Faro, aguarda URL do coletor) e OBS-05 (dashboards e alertas).
- 2026-10-26 (fim da tarde): **OBS-04** (Faro: Web Vitals, traces do browser ligados aos da API, qualidade das calls a cada 30 s, tunnel `/monitoring/faro`) concluído e no host. **OBS-05**: três dashboards e quatro alertas no Grafana (pasta Gameplay); falta o canal de notificação e o synthetic check de `/api/health/details`. Logs de requisição agora saem como warn (4xx) e error (5xx).
- 2026-10-27: **infra de produção criada** pelo Terraform (`infra/terraform`, branch `feature/production-infra`): instância Lightsail `gameplay-api` (x86_64, 2 GB, Docker 29 e swap de 2 GB), IP estático `gameplay-api-ip` (107.22.33.240), bucket `gameplay-uploads-431369014852`, usuário IAM `gameplay-api`, DNS `unlimited.oikos.company` com proxy e certificado de origem. `infra/production/.env` preenchido com os outputs. Dois ajustes no caminho: a Lightsail não aceita o mesmo nome em recursos de tipos diferentes (o IP virou `gameplay-api-ip`), e ela junta o próprio script na frente do user data, então o `bootstrap.sh` roda em `sh` (sem `pipefail`); o bootstrap foi rodado de novo por SSH. Falta: compose e nginx de produção, código para origens separadas (§6 do `06-producao-aws.md`), scripts de deploy e backup do `terraform.tfstate`. O `infra/docker-compose.dev.yml` foi removido pelo usuário.
- 2026-10-27: **primeiro deploy em produção** em `https://gameplay.oikos.company` (release `69221fe`, tag local `deploy-20261027-0239`). Decisão do usuário: web e API juntos no Lightsail, mesma origem, no lugar do Workers (INF-04 cancelado); `unlimited.oikos.company` deixou de existir. Deploy por `npm run deploy` (`infra/production/deploy.sh`): build aqui, envio por SSH, migração pelo `DIRECT_URL`, rollback para o release anterior e seed do admin. Banco começa vazio, só com o admin (decisão do usuário). `/api/health/details` operacional (banco, S3 e TURN). Pendências: e-mail do admin de produção (hoje `admin@gameplay.local`), `sslmode` do `DATABASE_URL` (aviso do `pg`), backup do `terraform.tfstate`, push da tag de deploy, PR da `feature/production-infra`.
- 2026-10-27: **plano do pipeline self-hosted** em `07-pipeline-self-hosted.md` (só plano): Jenkins em Compose (controller, agent e dind, sem Kubernetes), Ansible para provisionar e publicar, credenciais próprias do CI e fases CI-01 a CI-07. Objetivo do usuário: aprender deploy, chaves e pipeline; será revisto com calma antes de executar. Até lá o deploy segue pelo `npm run deploy`.
- Segurança para olhar depois (decisão do usuário em 2026-10-26): DSN do Sentry é público por natureza; proteger com Allowed Domains, rate limit da chave, filtros de entrada e `allowUrls` no SDK. Rodar os tokens do Grafana que apareceram no histórico da sessão.
- Próximos passos (anteriores): review do usuário, confirmar as suposições das notas dos tickets, abrir o PR da `feature/web-routing` para a `main`, DSN do Sentry, config do nginx de produção (inclui `/uploads`) e decidir o seletor de qualidade do espectador (`media-transport-options.md` seção 6, item 7).

## Backend (`apps/api`)

- 2026-10-24: scaffold inicial em NestJS 12 (commit 25ff3fb). Na validação do plano, o usuário decidiu **NestJS 11** (o `nestjs-asyncapi` e o `nestjs-zod` não aceitam o 12) e **Postgres + Prisma 7** (o Prisma 6 sai do suporte em 19/11/2026 e o Prisma 8 com Mongo ainda é RC). O scaffold será refeito no BE-01.
- Outras decisões do mesmo dia: `nestjs-asyncapi` para documentar os eventos, contrato tipado em `packages/contracts`, VPN só pelo check do STUN, convite de servidor consumido na criação do pedido.
- Tech plan em `04-tech-plan.md`; tickets em `tickets/` (índice e grafo em `tickets/README.md`).
- BE-01 concluído (branch `feature/be-01-nest11-shared`): API em NestJS 11 (CommonJS) e `packages/contracts` (`@gameplay/contracts`, ESM) consumido pela API e pelo web.
- Grafana Cloud configurado pelo usuário (stack `technologies`, sa-east-1); variáveis OTLP em `apps/api/.env` (gitignored), usadas no BE-16.
- BE-02 concluído: Postgres 18 no compose, env validado, Prisma 7, logs pino, `/api/health`, base dos e2e e imagem Docker da API (`npm run docker:api`).
- BE-03 concluído: contrato de erro, validação com zod, docs REST e Socket.IO no Scalar (só fora de produção), throttler e barramento de eventos.
- BE-04 concluído: Better Auth (email ou username, admin, 2FA), guard global, `@PlatformAdmin()`, seed do admin e primeira migration.
- BE-05 concluído: keys de cadastro (HMAC, rotas de admin, consumo no hook do sign-up com reserva e devolução se o cadastro falhar).
- BE-06 concluído: configurações da plataforma, override de servidores por usuário, resolvedor e rota pública da versão mínima do Chromium. Override por servidor vai para o BE-09.
- BE-07 concluído: storage local/S3, processamento de imagens com `sharp`, upload multipart. MinIO trocado pelo `adobe/s3mock` nos testes.
- BE-08 concluído: perfil, tema e idioma, avatar por upload e hardware por dispositivo (`/api/me/*`). Username continua pelo `/update-user` do Better Auth.
- BE-14 concluído: `GET /api/ice` com Cloudflare, coturn ou STUN só, cache por usuário e IP pelo proxy confiável (`TRUST_PROXY_HOPS`).
- BE-09 concluído: servidores e salas, tabela de permissões (`ServerPermissions` e `ServerAccessService`), limites por servidor e eventos `server.updated`, `server.deleted` e `room.changed`.
- BE-10 concluído: convites de servidor, pedidos de entrada, moderação e entrada pelo link no sign-up (módulo `memberships`).
- BE-11 concluído: gateway Socket.IO autenticado pelo cookie, `PresenceStore` em memória, `server:subscribe` e ponte dos eventos de domínio (`server:changed`, `server:removed`, `session:revoked`), com contrato em `packages/contracts` e AsyncAPI.
- BE-12 concluído: salas de voz no gateway (um lugar por pessoa, 30 s para reconectar), sinalização só entre quem está na mesma sala, mute, deafen e transmissão, pedidos de assistir e de qualidade só para o streamer, e limpeza por exclusão, kick e suspensão.
- BE-13 concluído: notificações do Hub gravadas a partir dos eventos de domínio, rotas de listar e dispensar, e `notification:new` pelo gateway.
- BE-15 concluído: painel do admin da plataforma (usuários com presença e sessões, suspender e reativar, encerrar sessões, redefinir senha, qualquer servidor, hardware por usuário e resumo da base).
- BE-16 concluído: OpenTelemetry (traces, métricas e logs por OTLP) com `trace_id` nos logs, desligado sem endpoint. Validado com coletor local e contra o Grafana Cloud (host e container, 2026-10-25); falta só ver os traces no Explore.
- **Todos os tickets do backend estão feitos.** Próximos passos possíveis: review do usuário (BE-05 a BE-16), confirmar as suposições das notas dos tickets e voltar ao frontend (ViewModels, Screens e rotas sobre a API).

### Estado em 2026-10-24 (retomar daqui)
- Branch `feature/api-setup`, no PR #2 para a `main`. O alinhamento do Storybook com a API e a renomeação de `packages/shared` para `packages/contracts` estão no PR #3 (`feature/storybook-contract-alignment`), que depende do #2. O usuário faz review a cada ticket antes do próximo. **BE-05 a BE-16 aguardando review.**
- **Backend completo** (BE-01 a BE-16). Suposições do BE-11 ao BE-16 a confirmar estão nas notas dos tickets.
- **Testes (pedido do usuário em 2026-10-24):** separar dados e factories. Um fake por arquivo, dados iniciais num arquivo de seed e a montagem do contexto em outro; nos e2e, factories em `test/factories/`. Aplicado em todos os módulos (2026-10-25): não há mais `test/fakes.ts`; o `FakeEventBus` fica em `src/common/test/`. Em 2026-10-25 os specs também deixaram de montar cenário próprio (sem `makeSut`): cada módulo tem `test/<módulo>-context.ts` sobre `test/<módulo>-seed.ts` (commit `c33be14`, feito em `feature/storybook-contract-alignment`, em cima do rename para `@gameplay/contracts`).
- **Camadas por módulo (decidido em 2026-10-24, ver `04-tech-plan.md` seção 1):** `use-cases/` são as ações chamadas pelos controllers; `services/` (`*.service.ts`, `XxxService`) é lógica compartilhada entre use-cases, e service nunca depende de use-case; `providers/` são detalhes técnicos trocáveis (aleatório, hash, API externa); `domain/` são regras puras. Exemplos: `EffectiveLimitsService.resolve()` (limites), `ServerAccessService.member()`/`require()` (acesso e permissão), `ServerViewsService` (resposta do servidor).
- **Padrões dos módulos novos:** transação com trava de linha (`SELECT ... FOR UPDATE`) para limites e unicidade: `ServersRepository.createWithOwner` e `RoomsRepository` recebem um `guard` que roda dentro da transação; `MembershipsRepository.withServerLock()` entrega um `MembershipStore`. Testes unitários usam `makeServersContext()` (`servers/test/fakes.ts`) e `makeMembershipsContext()` (`memberships/test/fakes.ts`), com `FakeEventBus`.
- **Suposições minhas a confirmar com o usuário:** username fora do perfil (fica no `/update-user`); `deviceMemory` arredondado em vez de recusado; ICE cai para STUN por 60 s se o provider falhar; `defaultRoomName` enviado pelo web na criação do servidor ("Room 1" se faltar); no sign-up só o convite vencido vira aviso. Detalhes nas notas de cada ticket.
- **Produção:** `TRUST_PROXY_HOPS=1` atrás do nginx (BE-14).
- Infra local para os testes: `docker compose -f infra/docker-compose.dev.yml up -d --wait postgres s3mock`. Se o `prisma migrate dev` travar sem saída, rodar com `< /dev/null`.
- `apps/api/.env` precisa de `REGISTRATION_KEY_SECRET` (já adicionado no ambiente local; ver `.env.example`).
- **Pendência do BE-04 resolvida:** todas as rotas `/api/auth/admin/*` desligadas (o painel do BE-15 usa rotas próprias com 2FA), além de fluxos de email, login social, exclusão de conta e OTP do 2FA. `change-password` e `update-user` ficam ligadas. Avatar só por upload: `update-user` recusa `image`, e o upload do BE-08 grava a URL em `user.image`. Detalhes em `tickets/BE-04-auth-better-auth.md`.
- **Ajuste do Storybook feito no PR #3:** o perfil hoje mostra username e email só leitura com o texto "Peça ao admin da plataforma para trocar seu email ou senha". Liberar a troca de username e de senha (com a senha atual); o email continua só leitura. O avatar vem de `session.user.image`.
- Nos documentos, `platform_admin` virou "admin da plataforma" (`user.role = 'admin'`). Papéis dentro do servidor ficam em `Membership.role`.
- Opcional sugerido: juntar as rotas do Better Auth no documento REST do Scalar (hoje é uma fonte separada no seletor).
- Banco de dev local tem um admin de teste criado pelo seed: `admin@gameplay.local` / `admin-pass-123`.
- Docker: `npm run docker:api` sobe a imagem de produção na porta 3334 ao lado do `npm run dev` (3333). Docs só na 3333.

## Assets fornecidos pelo usuário

- Logo "Gameplay": `~/Downloads/FireShot/gameplay.png`
- Logo "Gameplay UNLIMITED": `~/Downloads/FireShot/gameplay-unlimited.png`
- Mocks: `~/Downloads/FireShot/home-logado.png` (Hub atual), `~/Downloads/FireShot/servidor-screen.png` (tela do servidor), `~/Downloads/FireShot/Frame 9 (1).png` (card do usuário com painel de transmissão).
- Pedido em aberto: versões **SVG** dos logos, se existirem.

## Decisões pendentes do usuário

1. Onde o **cover** do servidor aparece na interface (proporção 16:9 assumida até lá).
2. Confirmar as suposições abaixo.
3. Banco da Fase 2: Postgres na EC2 (recomendado) ou outro Postgres gratuito. TiDB avaliado e descartado por enquanto (é MySQL; o projeto segue em Postgres). Não bloqueia os tickets.
4. Transporte de mídia: MVP só mesh, SFU na fase seguinte (decidido). Pendente: seletor de qualidade do espectador no MVP (`media-transport-options.md`, seção 6, item 7).

## Suposições a confirmar

Configuração da transmissão pelo usuário (proposta de 2026-10-24, ver `00-requirements.md` 3.1.1):
- Quem transmite escolhe o **preset** (720p30, 720p60, 1080p30, 1080p60, já decidido) e uma **prioridade**: "Fluidez" (padrão, mantém fps) ou "Nitidez" (mantém resolução, `contentHint 'detail'`, para texto e menus).
- Codec, bitrate, FEC e prioridade da voz são automáticos e não aparecem na interface do MVP.
- Trocar preset ou prioridade durante a transmissão aplica na hora, sem reiniciar (`applyConstraints` + `setParameters`). Trocar codec exigiria renegociação, por isso fica fora da interface.
- Quem assiste não configura nada no MVP; o jitter buffer fica baixo por padrão.

Visuais desenhados no Storybook sem mock (F3, F5, F7 a F13):
- Card do servidor (decisão do usuário): ícone, nome e engrenagem; clicar abre o modal do servidor. Member vê o ícone de sair do servidor no lugar da engrenagem.
- Card do usuário: a engrenagem abre as configurações do usuário; na sala, mute, deafen, engrenagem e telefone vermelho à direita.
- Painel de transmissão: um botão verde grande (Frame 9); ao clicar, abre a escolha de qualidade e áudio antes do seletor do browser.
- Ao vivo: monitor com envio, banda, FPS, resolução, espectadores e aviso de upload insuficiente.
- Selo "LIVE" e botão "Assistir" no bloco do participante; volume por pessoa num popover ao clicar no bloco.
- Assistindo: tela na área principal, faixa de participantes embaixo e troca entre transmissões quando há mais de uma.
- Modal do servidor e Configurações usam o mesmo modal com navegação lateral; "Sair ou excluir" e "Conta" ficam no fim, em vermelho.
- Convite de servidor (decisão do usuário): uso único, validade fixa de 1 hora, registra quem criou e quem usou.
- Pedido de entrada recusado: o convite já conta como usado.
- Keys de cadastro: validade 1, 7 ou 30 dias; a key aparece uma única vez (só o hash fica guardado) e a lista mostra os 3 últimos caracteres. Isso exige guardar esse sufixo junto do hash.
- Admin redefine senha digitando ou gerando uma nova senha, que ele repassa por canal privado.
- Hardware: coletado no login e sob demanda, um registro por dispositivo; o aviso de permissão dos monitores some depois de Permitir ou Agora não.
- Versão mínima do Chromium: valor configurável (exemplo usado: 130); o alerta dispensado não volta na mesma sessão.
- Notificações do Hub ficam guardadas por usuário até serem dispensadas; avisos em tempo real dentro do servidor continuam como toast.
- Avisos do F13 como toasts; queda de conexão como faixa amarela no topo.

- i18n com `i18next` + `react-i18next` + detector de idioma do browser (lib não estava definida no levantamento).
- Não há mock específico de SignIn/SignUp (o `Frame 2.png` é só o logo). O visual segue o ASCII do `02-core-flows.md` com o estilo do Hub.
- Username com 3 a 32 caracteres (letras, números, `.`, `-`, `_`).
- Key de convite mostrada em maiúsculas; a View aceita letras e números e o ViewModel normaliza.
- 2FA do admin: código TOTP em 6 caixas, com opção de código de recuperação em campo de texto.
- Lint segue com `oxlint` (veio do template do Vite), agora junto com `oxfmt`. O `eslint-plugin-boundaries` para as fronteiras MVVM ainda não foi configurado. Ele deve entrar pelo suporte a plugins JS do oxlint.

- Admin sai do servidor pelo modal ("Sair do servidor"), já que vê a engrenagem em vez do ícone de sair.
- Servidor novo já nasce com 1 sala (ocupa 1 das 2 vagas padrão).
- Deafen também silencia o próprio microfone, como no Discord.
- Só é possível estar em uma sala por vez; clicar em outra troca direto.
- Excluir o servidor exige digitar o nome dele.
- Microfone negado: a pessoa entra na sala só ouvindo, com aviso.
- Testes do driver S3 rodam contra MinIO em container.
- Assistindo no celular deitado: a barra do app some, a barra da transmissão e os cards ficam por cima do vídeo, e um toque no vídeo mostra ou esconde os dois. Não há auto-ocultar por tempo *(suposição)*.
- Volume da tela e tela cheia ficam escondidos em telas touch (`hover: none` e `pointer: coarse`, inclui iPad) até termos uma solução para o Safari do iPhone.
- Refresh durante a call: a aba guarda a sala no `sessionStorage` e marca a hora em que a página saiu. Ao recarregar em até 30 s (o tempo que a API segura o lugar), volta para a sala sozinha. Se o lugar ainda dizia que a aba transmitia, a transmissão é encerrada, porque ela morreu com a página. O som dos outros pode só começar no primeiro clique ou tecla (regra de autoplay do navegador). A janela de 30 s no cliente é fixa e precisa acompanhar `ROOM_RECONNECT_GRACE_MS` *(suposição)*.
