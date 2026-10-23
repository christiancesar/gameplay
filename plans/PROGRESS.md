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
4. ~~Tema claro/escuro e EN/PT~~. Feito na infra: toolbar de tema (padrão escuro) e de idioma no Storybook; i18next em `src/shared/i18n`. Paleta: **neutral padrão do shadcn** (decisão do usuário), com cores do Tailwind para destaques (`emerald` para transmitir, `red` para sair da sala).
5. **Todas as Views dos fluxos F1 a F13 estão no Storybook**, com stories de todos os estados e interaction tests (157 testes). A página "Introdução" do Storybook liga cada fluxo às stories.

Próximo passo sugerido: o usuário revisar o visual no Storybook (`npm run storybook`, porta 6006) e depois seguir para `/prd-validate` e `/tech-plan`. ViewModels, Screens e rotas ainda não existem.

## Assets fornecidos pelo usuário

- Logo "Gameplay": `~/Downloads/FireShot/gameplay.png`
- Logo "Gameplay UNLIMITED": `~/Downloads/FireShot/gameplay-unlimited.png`
- Mocks: `~/Downloads/FireShot/home-logado.png` (Hub atual), `~/Downloads/FireShot/servidor-screen.png` (tela do servidor), `~/Downloads/FireShot/Frame 9 (1).png` (card do usuário com painel de transmissão).
- Pedido em aberto: versões **SVG** dos logos, se existirem.

## Decisões pendentes do usuário

1. Onde o **cover** do servidor aparece na interface (proporção 16:9 assumida até lá).
2. Confirmar as suposições abaixo.

## Suposições a confirmar

Visuais desenhados no Storybook sem mock (F3, F5, F7 a F13):
- Card do servidor (decisão do usuário): ícone, nome e engrenagem; clicar abre o modal do servidor. Member vê o ícone de sair do servidor no lugar da engrenagem.
- Card do usuário: a engrenagem abre as configurações do usuário; na sala, mute, deafen, engrenagem e telefone vermelho à direita.
- Painel de transmissão: um botão verde grande (Frame 9); ao clicar, abre a escolha de qualidade e áudio antes do seletor do browser.
- Ao vivo: monitor com envio, banda, FPS, resolução, espectadores e aviso de upload insuficiente.
- Selo "LIVE" e botão "Assistir" no bloco do participante; volume por pessoa num popover ao clicar no bloco.
- Assistindo: tela na área principal, faixa de participantes embaixo e troca entre transmissões quando há mais de uma.
- Modal do servidor e Configurações usam o mesmo modal com navegação lateral; "Sair ou excluir" e "Conta" ficam no fim, em vermelho.
- Convites: máximo de usos 1, 5, 10 ou 25; validade 1 hora, 1 dia, 7 dias ou 30 dias.
- Keys de cadastro: validade 1, 7 ou 30 dias; a key aparece uma única vez (só o hash fica guardado) e a lista mostra os 3 últimos caracteres. Isso exige guardar esse sufixo junto do hash.
- Admin redefine senha digitando ou gerando uma nova senha, que ele repassa por canal privado.
- Avisos do F13 como toasts; queda de conexão como faixa amarela no topo.

- i18n com `i18next` + `react-i18next` + detector de idioma do browser (lib não estava definida no levantamento).
- Não há mock específico de SignIn/SignUp (o `Frame 2.png` é só o logo). O visual segue o ASCII do `02-core-flows.md` com o estilo do Hub.
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
