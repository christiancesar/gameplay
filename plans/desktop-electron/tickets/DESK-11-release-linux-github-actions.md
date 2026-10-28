# DESK-11 · Release do Linux pelo GitHub Actions

> Pontos: 5 · Depende de: DESK-10 · Branch `feature/desktop-release`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 6 e 8. A primeira versão distribuída do app é só Linux (deb e zip), sem assinatura e sem atualização dentro do app: o usuário baixa o deb novo no GitHub Releases. O build sai do GitHub Actions, não da máquina de quem desenvolve.

**Versão `0.0.{x}`, subida por um disparo manual.** O usuário avisa quando quer uma release; o workflow sobe o número sozinho. Como a regra do repositório proíbe commit direto em `dev` e `main`, o workflow **não commita o número**: a próxima versão é calculada a partir da última tag `desktop-v*` (a primeira é `0.0.1`), escrita no `apps/desktop/package.json` só dentro do runner, e a tag nasce junto com o release. O `package.json` do repositório continua em `0.0.0`, e a fonte da verdade são as tags.

## Escopo
- `.github/workflows/desktop-release.yml`, gatilho `workflow_dispatch` (sem entradas), `runs-on: ubuntu-latest`, `permissions: contents: write`.
- Passos: checkout com histórico e tags; Node da versão do projeto; `npm ci`; `npm run typecheck`, `npm run lint`, `npm test`; calcular a versão e gravá-la no `apps/desktop/package.json`; `npm run make -w desktop`; `gh release create desktop-v0.0.{x} --target <sha>` com o deb e o zip como assets.
- O workflow recusa rodar fora da `main`. Suposição de partida: a release sai do que já foi para a `main`.
- Env do build vinda do GitHub: variável `GAMEPLAY_SERVER_URL` do repositório vira `VITE_SERVER_URL`; `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT=production` e os `SENTRY_*` de source maps vêm de variáveis e secrets. Sem os de Sentry, o Sentry fica desligado; sem `GAMEPLAY_SERVER_URL`, o build falha (DESK-10).
- Source maps do main e do renderer enviados ao projeto do Electron no Sentry durante o build (pendência do TEL-04), sem entrarem no pacote.
- Notas da release geradas pelos commits desde a tag anterior (`gh release create --generate-notes`).
- `npm run desktop:make` local continua como está.
- Documentação curta em `apps/desktop/README.md` ou no `AGENTS.md`: como disparar a release, quais variáveis e secrets o repositório precisa, como montar o próprio app com outra `VITE_SERVER_URL`.
- Conferir o `chrome-sandbox` do deb instalado de verdade (pendência do DESK-05): o SUID no `postinst`, sem `--no-sandbox`.

## Fora do escopo
Windows, macOS, assinatura, `autoUpdater`, aviso de versão nova no app, versão mínima no `/api/health` e OTA (DESK-12 e DESK-13). CI de PR (typecheck e testes a cada PR): não existe hoje e é outro assunto.

## Checklist
- [ ] Workflow com o disparo manual, a trava de `main` e o cálculo da versão pela última tag
- [ ] Typecheck, lint e testes antes do build, no workflow
- [ ] Env do build (servidor, Sentry) lida de variáveis e secrets do repositório
- [ ] deb e zip anexados ao release, com notas geradas
- [ ] Source maps enviados ao Sentry sem entrar no pacote
- [ ] Documentação de como disparar e do que o repositório precisa
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] Disparo pela primeira vez: cria a tag `desktop-v0.0.1` e o release com deb e zip
- [ ] Segundo disparo: sobe para `desktop-v0.0.2`, sem commit novo em nenhuma branch
- [ ] Disparo a partir de outra branch que não a `main`: o workflow recusa
- [ ] Instalar o deb baixado do release numa máquina Linux: o app abre direto no login do servidor de produção (DESK-10), com a versão do release em Sobre ou nos logs, e o sandbox do Chromium ativo
- [ ] A versão que o Sentry mostra (release) bate com a tag
- [ ] Transmitir com o áudio de um aplicativo no app instalado (DESK-07) continua funcionando
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes

## Critério de aceite
Um disparo manual do workflow, a partir da `main`, publica no GitHub Releases um deb e um zip do Linux na versão `0.0.{x}` seguinte, apontando para o servidor definido pelas variáveis do repositório.

## Notas da execução
(preencher ao concluir, com as suposições marcadas como *(suposição)*)

## Suposições a confirmar
- *(suposição)* A release sai da `main` (depois do merge da `dev`), e a tag é criada pelo `gh release create` sobre o commit do disparo.
- *(suposição)* `gh release create` no workflow, sem o `publisher-github` do Forge (uma dependência a menos para o mesmo resultado).
- *(suposição)* O repositório permite baixar os assets do release a quem for usar o app. Se ele for privado, o download exige login no GitHub e a distribuição precisa de outro canal (por exemplo o bucket S3).
- *(suposição)* Só o número do patch sobe (`0.0.{x}`). Subir minor ou major é uma mudança futura do workflow, avisada pelo usuário.
