# Progresso do planejamento

> Última atualização: 2026-10-24 (BE-01 a BE-07 concluídos).

## Status das fases (workflow ágil)

| Fase | Arquivo | Status |
|---|---|---|
| 00 · Levantamento | `00-requirements.md` | Concluída |
| 01 · Epic Brief | `01-epic-brief.md` | Rascunho entregue, sem objeções |
| 02 · Core Flows | `02-core-flows.md` | Concluída para as telas com mock; F7 a F13 terão o visual desenhado no Storybook |
| 03 · PRD Validate | | Não iniciada |
| 04 · Tech Plan | `04-tech-plan.md` | Rascunho do backend entregue, aguardando revisão do usuário |
| Tickets e delegação | `tickets/` | 16 tickets do backend (BE-01 a BE-16), um por arquivo, aguardando revisão |

## Próxima sessão

O usuário decidiu ir **direto para o Storybook**, antes de PRD Validate e Tech Plan. O Storybook passa a ser onde o visual dos fluxos sem mock é desenhado e validado.

Escopo mínimo para começar:
1. ~~`git init` e branch de trabalho~~. Feito: repo com branch `chore/monorepo-setup` (sem commits ainda).
2. ~~Monorepo npm workspaces + Turborepo com `apps/web`~~. Feito: Vite 8, React 19, TS 6, Tailwind 4, shadcn (radix, preset nova) com componentes em `src/shared/ui`.
3. ~~Storybook com interaction tests~~. Feito: Storybook 10 + `@storybook/addon-vitest` (Chromium headless via Playwright). `npm test` roda as play functions.
4. ~~Tema claro/escuro e EN/PT~~. Feito na infra: toolbar de tema (padrão escuro) e de idioma no Storybook; i18next em `src/shared/i18n`. Paleta: **neutral padrão do shadcn** (decisão do usuário), com cores do Tailwind para destaques (`emerald` para transmitir, `red` para sair da sala).
5. **Todas as Views dos fluxos F1 a F13 estão no Storybook**, com stories de todos os estados e interaction tests (157 testes). A página "Introdução" do Storybook liga cada fluxo às stories.

Próximo passo sugerido: o usuário revisar o visual no Storybook (`npm run storybook`, porta 6006) e depois seguir para `/prd-validate` e `/tech-plan`. ViewModels, Screens e rotas ainda não existem.

## Backend (`apps/api`)

- 2026-10-24: scaffold inicial em NestJS 12 (commit 25ff3fb). Na validação do plano, o usuário decidiu **NestJS 11** (o `nestjs-asyncapi` e o `nestjs-zod` não aceitam o 12) e **Postgres + Prisma 7** (o Prisma 6 sai do suporte em 19/11/2026 e o Prisma 8 com Mongo ainda é RC). O scaffold será refeito no BE-01.
- Outras decisões do mesmo dia: `nestjs-asyncapi` para documentar os eventos, contrato tipado em `packages/shared`, VPN só pelo check do STUN, convite de servidor consumido na criação do pedido.
- Tech plan em `04-tech-plan.md`; tickets em `tickets/` (índice e grafo em `tickets/README.md`).
- BE-01 concluído (branch `feature/be-01-nest11-shared`): API em NestJS 11 (CommonJS) e `packages/shared` (`@gameplay/shared`, ESM) consumido pela API e pelo web.
- Grafana Cloud configurado pelo usuário (stack `technologies`, sa-east-1); variáveis OTLP em `apps/api/.env` (gitignored), usadas no BE-16.
- BE-02 concluído: Postgres 18 no compose, env validado, Prisma 7, logs pino, `/api/health`, base dos e2e e imagem Docker da API (`npm run docker:api`).
- BE-03 concluído: contrato de erro, validação com zod, docs REST e Socket.IO no Scalar (só fora de produção), throttler e barramento de eventos.
- BE-04 concluído: Better Auth (email ou username, admin, 2FA), guard global, `@PlatformAdmin()`, seed do admin e primeira migration.
- BE-05 concluído: keys de cadastro (HMAC, rotas de admin, consumo no hook do sign-up com reserva e devolução se o cadastro falhar).
- BE-06 concluído: configurações da plataforma, override de servidores por usuário, resolvedor e rota pública da versão mínima do Chromium. Override por servidor vai para o BE-09.
- BE-07 concluído: storage local/S3, processamento de imagens com `sharp`, upload multipart. MinIO trocado pelo `adobe/s3mock` nos testes.
- Próximo: BE-08 ou BE-14 (onda 5), ou BE-16 (onda 3).

### Estado em 2026-10-24 (retomar daqui)
- Branch `feature/api-setup`, tudo commitado, sem push. O usuário faz review a cada ticket antes do próximo. **BE-05, BE-06 e BE-07 aguardando review.**
- `apps/api/.env` precisa de `REGISTRATION_KEY_SECRET` (já adicionado no ambiente local; ver `.env.example`).
- **Pendência do BE-04 resolvida:** todas as rotas `/api/auth/admin/*` desligadas (o painel do BE-15 usa rotas próprias com 2FA), além de fluxos de email, login social, exclusão de conta e OTP do 2FA. `change-password` e `update-user` ficam ligadas. Avatar só por upload: `update-user` recusa `image`, e o upload do BE-08 grava a URL em `user.image`. Detalhes em `tickets/BE-04-auth-better-auth.md`.
- **Ajuste pendente no Storybook:** o perfil hoje mostra username e email só leitura com o texto "Peça ao admin da plataforma para trocar seu email ou senha". Liberar a troca de username e de senha (com a senha atual); o email continua só leitura. O avatar vem de `session.user.image`.
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
