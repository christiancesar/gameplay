# Progresso do planejamento

> Última atualização: 2026-10-23 (setup do monorepo).

## Status das fases (workflow ágil)

| Fase | Arquivo | Status |
|---|---|---|
| 00 · Levantamento | `00-requirements.md` | Concluída |
| 01 · Epic Brief | `01-epic-brief.md` | Rascunho entregue, sem objeções |
| 02 · Core Flows | `02-core-flows.md` | Concluída para as telas com mock; F7 a F13 terão o visual desenhado no Storybook |
| 03 · PRD Validate | | Não iniciada |
| 04 · Tech Plan | | Não iniciada |
| Tickets e delegação | | Não iniciada |

## Próxima sessão

O usuário decidiu ir **direto para o Storybook**, antes de PRD Validate e Tech Plan. O Storybook passa a ser onde o visual dos fluxos sem mock é desenhado e validado.

Escopo mínimo para começar:
1. ~~`git init` e branch de trabalho~~. Feito: repo com branch `chore/monorepo-setup` (sem commits ainda).
2. ~~Monorepo npm workspaces + Turborepo com `apps/web`~~. Feito: Vite 8, React 19, TS 6, Tailwind 4, shadcn (radix, preset nova) com componentes em `src/shared/ui`.
3. ~~Storybook com interaction tests~~. Feito: Storybook 10 + `@storybook/addon-vitest` (Chromium headless via Playwright). `npm test` roda as play functions.
4. ~~Tema claro/escuro e EN/PT~~. Feito na infra: toolbar de tema (padrão escuro) e de idioma no Storybook; i18next em `src/shared/i18n`. Paleta do Gameplay aplicada em `src/index.css`: escuro amostrado do `home-logado.png`, claro derivado dele.
5. Primeiras Views. **SignIn e SignUp feitos** (`src/modules/auth/views`), com stories de todos os estados e interaction tests. Faltam: Hub, tela do servidor com o card do usuário e o painel de transmissão, e o modal do servidor. Views listadas: (só apresentação, seguindo o MVVM do `00-requirements.md` §3.4): SignIn, SignUp (com input OTP de 6 caracteres), Hub, tela do servidor com o card do usuário e o painel de transmissão, e o modal do servidor.

## Assets fornecidos pelo usuário

- Logo "Gameplay": `~/Downloads/FireShot/gameplay.png`
- Logo "Gameplay UNLIMITED": `~/Downloads/FireShot/gameplay-unlimited.png`
- Mocks: `~/Downloads/FireShot/home-logado.png` (Hub atual), `~/Downloads/FireShot/servidor-screen.png` (tela do servidor), `~/Downloads/FireShot/Frame 9 (1).png` (card do usuário com painel de transmissão).
- Pedido em aberto: versões **SVG** dos logos, se existirem.

## Decisões pendentes do usuário

1. Onde o **cover** do servidor aparece na interface (proporção 16:9 assumida até lá).
2. Confirmar as suposições abaixo.

## Suposições a confirmar

- i18n com `i18next` + `react-i18next` + detector de idioma do browser (lib não estava definida no levantamento).
- Não há mock específico de SignIn/SignUp (o `Frame 2.png` é só o logo). O visual segue o ASCII do `02-core-flows.md` com o estilo do Hub.
- Botão principal branco no tema escuro (o mock não mostra um CTA principal). Textos secundários mais claros que no mock, para ter contraste legível.
- Username com 3 a 32 caracteres (letras, números, `.`, `-`, `_`).
- Key de convite mostrada em maiúsculas; a View aceita letras e números e o ViewModel normaliza.
- 2FA do admin: código TOTP em 6 caixas, com opção de código de recuperação em campo de texto.
- Lint segue com `oxlint` (veio do template do Vite). O `eslint-plugin-boundaries` para as fronteiras MVVM ainda não foi configurado.

- Admin sai do servidor pelo modal ("Sair do servidor"), já que vê a engrenagem em vez do ícone de sair.
- Servidor novo já nasce com 1 sala (ocupa 1 das 2 vagas padrão).
- Deafen também silencia o próprio microfone, como no Discord.
- Só é possível estar em uma sala por vez; clicar em outra troca direto.
- Excluir o servidor exige digitar o nome dele.
- Microfone negado: a pessoa entra na sala só ouvindo, com aviso.
- Testes do driver S3 rodam contra MinIO em container.
