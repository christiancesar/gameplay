# DESK-11 · Release do Linux pelo GitHub Actions

> Pontos: 5 · Depende de: DESK-10 · Branch `feature/desktop-release`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 6 e 8. A primeira versão distribuída do app é só Linux (deb e zip), sem assinatura e sem atualização dentro do app: o usuário baixa o deb novo no GitHub Releases. O build sai do GitHub Actions, não da máquina de quem desenvolve.

**Versão `0.0.{x}`, subida por um disparo manual.** O usuário avisa quando quer uma release; o workflow sobe o número sozinho. Como a regra do repositório proíbe commit direto em `dev` e `main`, o workflow **não commita o número**: a próxima versão é calculada a partir da última tag `v*` (a primeira é `0.0.1`), escrita no `apps/desktop/package.json` só dentro do runner, e a tag nasce junto com o release. O `package.json` do repositório continua em `0.0.0`, e a fonte da verdade são as tags.

## Escopo
- `.github/workflows/desktop-release.yml`, gatilho `workflow_dispatch` (sem entradas), `runs-on: ubuntu-latest`, `permissions: contents: write`.
- Passos: checkout com histórico e tags; Node da versão do projeto; `npm ci`; `npm run typecheck`, `npm run lint`, `npm test`; calcular a versão e gravá-la no `apps/desktop/package.json`; `npm run publish -w desktop` (`electron-forge publish`, que faz o `make` e envia o deb e o zip como assets do release).
- O workflow recusa rodar fora da `main`: a release sai do que já foi para a `main` (decidido pelo usuário em 2026-10-28).
- Publisher: `@electron-forge/publisher-github` em `forge.config.ts` (`publishers`), autenticado pelo `GITHUB_TOKEN` do próprio workflow; sem custo extra. Config: `repository` `christiancesar/gameplay`, `generateReleaseNotes: true`, `draft: false`. A tag segue o padrão do Forge, `v{versão}` (decidido pelo usuário). Conferir que ela aponta para o commit do disparo.
- Env do build vinda do GitHub: `VITE_APP_ENV=production` fixo no workflow. O job usa o environment `electron-production` do GitHub (só a `main` pode usá-lo), com as variáveis `VITE_SERVER_URL`, `VITE_SENTRY_DSN`, `SENTRY_ORG` e `SENTRY_PROJECT` e o secret `SENTRY_AUTH_TOKEN`, com os mesmos nomes do `.env`. Sem os de Sentry, o Sentry fica desligado; sem `VITE_SERVER_URL`, o build falha (DESK-10).
- Source maps do main e do renderer enviados ao projeto do Electron no Sentry durante o build (pendência do TEL-04), sem entrarem no pacote.
- Notas da release geradas pelo GitHub (`generateReleaseNotes`).
- `npm run desktop:make` local continua como está.
- Script `publish` no `apps/desktop/package.json` (`electron-forge publish`) e `npm run desktop:publish` na raiz.
- Documentação curta em `apps/desktop/README.md` ou no `AGENTS.md`: como disparar a release, quais variáveis e secrets o repositório precisa, como montar o próprio app com outra `VITE_SERVER_URL`.
- Conferir o `chrome-sandbox` do deb instalado de verdade (pendência do DESK-05): o SUID no `postinst`, sem `--no-sandbox`.

## Fora do escopo
Windows, macOS, assinatura, `autoUpdater`, aviso de versão nova no app, versão mínima no `/api/health` e OTA (DESK-12 e DESK-13). CI de PR (typecheck e testes a cada PR): não existe hoje e é outro assunto.

## Checklist
- [x] Workflow com o disparo manual, a trava de `main` e o cálculo da versão pela última tag
- [x] Typecheck, lint e testes antes do build, no workflow
- [x] Env do build (servidor, Sentry) lida de variáveis e secrets do repositório
- [x] `publisher-github` configurado e deb e zip anexados ao release, com notas geradas
- [x] Source maps enviados ao Sentry sem entrar no pacote
- [x] Documentação de como disparar e do que o repositório precisa
- [x] Commit a cada passo verde

## Checklist de validação
- [ ] Disparo pela primeira vez: cria a tag `v0.0.1` e o release com deb e zip
- [ ] Segundo disparo: sobe para `v0.0.2`, sem commit novo em nenhuma branch
- [ ] Disparo a partir de outra branch que não a `main`: o workflow recusa
- [ ] Instalar o deb baixado do release numa máquina Linux: o app abre direto no login do servidor de produção (DESK-10), com a versão do release em Sobre ou nos logs, e o sandbox do Chromium ativo
- [ ] A versão que o Sentry mostra (release) bate com a tag
- [ ] Transmitir com o áudio de um aplicativo no app instalado (DESK-07) continua funcionando
- [x] `npm run typecheck`, `npm run lint`, `npm run format:check`, testes do desktop verdes

## Critério de aceite
Um disparo manual do workflow, a partir da `main`, publica no GitHub Releases um deb e um zip do Linux na versão `0.0.{x}` seguinte, apontando para o servidor definido pelas variáveis do repositório.

## Notas da execução


## Notas da execução (2026-10-28)

Escrito na `feature/desktop-app`. **A parte que roda no GitHub (os itens de validação ainda abertos acima) só pode ser conferida no primeiro disparo**, que depende deste código estar na `main` e das variáveis do repositório. O que foi conferido localmente está marcado.

O que foi feito:
- `.github/workflows/desktop-release.yml`: `workflow_dispatch`, trava de `main`, `fetch-depth: 0`, Node 24, `dpkg` e `fakeroot`, `npm ci`, typecheck, lint, testes (`turbo run test` filtrado em `desktop`, `desktop-bridge` e `contracts`), cálculo da versão pela última tag `v0.0.*` (ordenação numérica: `v0.0.10` vem depois de `v0.0.2`; sem tag, começa em `0.0.1`), `npm pkg set version` só no runner e `npm run publish -w desktop`.
- `@electron-forge/publisher-github` (8.0.1) em `forge.config.ts`: repositório `christiancesar/gameplay`, `draft: false` (o padrão do Forge é rascunho), `generateReleaseNotes`, tag no padrão `v{versão}`. O Forge cria a tag no HEAD da branch padrão, que é a `main` de onde o disparo sai.
- Scripts `publish` (desktop) e `desktop:publish` (raiz).
- Source maps: `sentry-source-maps.ts` (`@sentry/vite-plugin`, o mesmo do web) ligado nos Vite do main e do renderer. Só age com `SENTRY_AUTH_TOKEN`: gera maps `hidden`, envia ao release `gameplay-desktop@{versão}` (o mesmo nome que o app usa) e apaga os maps.
- `apps/desktop/README.md`: as duas envs, o disparo, as variáveis e o secret que o repositório precisa.

Conferido localmente:
- `make` com `VITE_APP_ENV=production`, servidor e um token falso: gera `gameplay_0.0.0_amd64.deb` e o zip; o deb leva o `chrome-sandbox` com SUID root (`-rwsr-xr-x`), o que fecha em pacote a pendência do DESK-05; nenhum `.map` ficou no pacote.
- O cálculo da versão num repositório de teste (`v0.0.1`, `v0.0.2`, `v0.0.10` dá `0.0.11`; sem tags dá `0.0.1`).
- Typecheck, lint, format e 69 testes do desktop.

Não conferido:
- O envio real dos source maps e a publicação no GitHub (o token do Sentry de verdade não foi usado de propósito, para não poluir o projeto).
- O app do deb instalado numa máquina Linux (o sandbox só foi visto no pacote, não em execução).
- Os testes do `client` e da API não rodam no workflow (o client usa Playwright; não existe CI de PR no repositório). Os do desktop, da ponte e dos contratos rodam.

Suposições:
- Decidido pelo usuário: variáveis com os mesmos nomes do `.env`, num environment `electron-production`. Criado com o `gh` em 2026-10-28 (`VITE_SERVER_URL` = `https://gameplay.oikos.company`, os valores de Sentry copiados do `apps/desktop/.env`), com a política de branches limitada à `main`.
- *(suposição)* Node 24, igual ao da máquina de desenvolvimento.
- *(suposição)* O preload fica sem source map (o Vite dele não gera); é um arquivo de 1 KB.
- *(suposição)* O release sai publicado, não como rascunho, porque o disparo já é a decisão de publicar.

## Suposições a confirmar
- Decidido pelo usuário: a release sai da `main`, e o `publisher-github` do Forge publica (sem custo; o `GITHUB_TOKEN` do workflow basta).
- Decidido pelo usuário: a tag segue o padrão do Forge (`v{versão}`). Os detalhes da publicação são tratados quando o ticket chegar perto de ser feito.
- O repositório é público (confirmado pelo usuário em 2026-10-28): download dos assets sem login e minutos do Actions sem custo.
- *(suposição)* Só o número do patch sobe (`0.0.{x}`). Subir minor ou major é uma mudança futura do workflow, avisada pelo usuário.
