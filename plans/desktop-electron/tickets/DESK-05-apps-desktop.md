# DESK-05 · `apps/desktop` com Electron Forge

> Pontos: 5 · Depende de: DESK-04 · Branch `feature/desktop-app`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 2, 5.2 e 7. O desktop roda o mesmo `packages/client`. Sem recursos nativos de captura: a transmissão usa o `getDisplayMedia` padrão do Chromium.

## Escopo
- **Primeiro, o teste do cookie (decide a sessão do desktop).** Com o app rodando, o main reescreve o `Set-Cookie` das respostas do servidor para `SameSite=None; Secure` (`session.webRequest.onHeadersReceived`, só para a origem do servidor escolhido) e o renderer faz login, 2FA e conecta o socket **sem** o token. Resultado:
  - Funcionou (sessão, 2FA do admin e socket): **sai o Bearer**. A `desktopPlatform` usa `session` sem efeito, como a do web; o DESK-06 não guarda token; o plugin `bearer`, o `auth.token` do socket e o que os usa saem da API e do client numa mudança pequena e testada. Um mecanismo só, igual ao web.
  - Não funcionou (o Chromium do Electron recusou o cookie de terceiro, por exemplo): **fica o Bearer** do DESK-04, e a reescrita fica só para o desafio de 2FA.
  - Em qualquer caso, anotar nas notas o que se viu e a decisão. Servidor em `http` fora de `localhost` e `127.0.0.1` não guarda cookie `Secure`: no caso do cookie, ele só é aceito em HTTPS ou nesses dois endereços.
- Scaffold com Electron Forge, template `vite-typescript`, adaptado ao monorepo (workspace `apps/desktop`, scripts na raiz pelo Turborepo). Conferir a doc atual do Forge e do plugin Vite antes.
- `src/main/main.ts`: janela, protocolo `app://gameplay` servindo o renderer (com fallback para o `index.html`), CSP, trava de navegação (links externos no browser do sistema), `contextIsolation`, `sandbox`, sem `nodeIntegration`, fuses do Forge.
- `src/main/ipc.ts` e `src/main/modules/` criados vazios, prontos para o DESK-06.
- `src/preload/preload.ts` sem canais ainda.
- `src/renderer/`: monta o `App` do `packages/client` com uma `desktopPlatform` inicial (`kind: 'desktop'`, capacidades do Chromium, servidor e token em memória até o DESK-06).
- Tela de escolha do servidor na primeira abertura: View nova com story no `packages/client`, mostrada quando a plataforma não tem servidor.
- Makers só para Linux nesta fase (deb e zip), sem assinatura e sem atualização.

## Fora do escopo
IPC e `safeStorage` (DESK-06). Captura nativa e áudio (fase 2). Assinatura, publicação e atualização (DESK-10 e DESK-11).

## Checklist
- [x] Teste do cookie reescrito feito (sessão, 2FA e socket sem token) e a decisão, Bearer fora ou dentro, anotada
- [x] Forge e plugin Vite funcionando no workspace, com o renderer importando o código-fonte do `packages/client`
- [x] Tailwind e router plugin funcionando no renderer
- [x] Protocolo `app://`, CSP, trava de navegação e flags de segurança
- [x] `desktopPlatform` inicial
- [x] View e rota de escolha do servidor, com story
- [x] `npm run make -w desktop` gerando o deb no Linux
- [x] Docs: `AGENTS.md` com os comandos do desktop
- [x] Commit a cada passo verde

## Checklist de validação
- [x] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` verdes
- [x] No Electron real: login e 2FA do admin concluem, e o socket conecta, pelo caminho decidido (cookie ou Bearer)
- [x] `npm run start -w desktop` abre a janela, pede o servidor, faz login, entra numa sala, fala por voz e transmite tela (conferido com o Electron sem janela, em Xvfb, contra a API local)
- [x] DevTools do desktop: `window.require` e `process` indefinidos no renderer
- [x] Link externo abre no browser do sistema, não na janela do app
- [x] O pacote gerado instala e abre no Linux
- [x] Web sem regressão (testes e uso manual)

## Critério de aceite
O app desktop abre no Linux e faz no self-hosted o mesmo que o web, a partir do mesmo código.

## Notas da execução (2026-10-28)

**Decisão do teste do cookie: o Bearer saiu.** No Electron real (Xvfb, janela `app://gameplay` contra a API local em `localhost:3333`), com o main reescrevendo o `Set-Cookie` para `SameSite=None; Secure`: escolha do servidor, login, desafio de 2FA do admin (TOTP), sessão, rotas `/api/*` e socket funcionaram só por cookie, sem erro. A primeira rodada mostrou dois problemas, ambos corrigidos: o Better Auth client recusa a origem `app://` como base (`Invalid base URL`, resolvido com um endereço de lugar-ocupado que o `customFetchImpl` troca a cada chamada) e o polling do Socket.IO foi bloqueado por CORS sem credenciais (o gateway passou a responder `credentials: true` para a origem do desktop). Depois disso o plugin `bearer`, o token no handshake e `Platform.server.session` foram removidos (ver a revisão no DESK-04 e a seção 4 do tech plan).

O que foi feito:
- `apps/desktop` (workspace `desktop`): Forge 8 com o plugin Vite 8 (a configuração dos três builds é nossa: o renderer importa o código-fonte do `packages/client` e o `@/`, o Tailwind e o router plugin apontam para o pacote), `forge.config.ts` com makers deb e zip só para Linux e os fuses (`RunAsNode` e inspetor de CLI desligados, cookies cifrados, integridade do ASAR, só carrega do ASAR).
- Main (`src/main`): janela com `contextIsolation`, `sandbox` e sem `nodeIntegration`; protocolo `app://gameplay` servindo o build com o `index.html` como retorno de qualquer rota (e proteção contra `..` e `%2e%2e`, em `asset-path.ts`); CSP no HTML (`security.ts`); trava de navegação (links `https` abrem no navegador do sistema, todo o resto é barrado); lista de permissões (mídia, captura de tela, tela cheia, área de transferência, notificações); instância única; `ipc.ts` vazio; `modules/session/cookie-policy.ts`; `modules/capture/display-media-handler.ts`.
- Renderer: monta o `App` do client com `createDesktopPlatform` (a plataforma do browser mais `kind: 'desktop'` e a escolha do servidor, guardada no `localStorage` da página até o DESK-06).
- Client: novo módulo `server-choice` (ViewModel, View com 6 stories, Screen, regra `normalizeServerAddress`, verificação `GET /api/health`, i18n em inglês e português) e o `App` mostra essa tela enquanto a plataforma pede um servidor e ainda não há um. Antes da escolha nada fala com a API.
- Raiz: scripts `npm run desktop` e `npm run desktop:make`; `AGENTS.md` com os comandos.

Validação:
- Typecheck, lint, format e `npm test` verdes: desktop 14 testes (cookie, caminho de arquivo, segurança, escolha de fonte), client 186 arquivos e 1283 testes (eram 182 e 1264), API 375 unitários e 161 e2e.
- Electron (script temporário com Playwright, fora do repositório): chooser, login, 2FA, rota aninhada recarregada em `app://gameplay/servers/<id>` (retorno ao `index.html`), entrada na sala de voz com microfone de teste, transmissão de tela até aparecer "You are presenting to everyone" e parada, sem erro de página nem de console.
- `window.require`, `process` e `Buffer` indefinidos no renderer. `window.open('file:///...')` não abre janela e `location = 'file:///...'` fica em `app://gameplay/`. Script inline bloqueado pelo CSP.
- `npm run make`: `gameplay_0.0.0_amd64.deb` (pacote e binário `gameplay`, 94 MB) e `gameplay-linux-x64-0.0.0.zip`. O deb foi extraído (`dpkg-deb -x`, sem instalar) e o binário abriu `app://gameplay/`. O pacote com os fuses também abriu (checado pela porta de depuração do Chromium).
- O Cypress do web não mudou e roda como antes (o `apps/web` não foi tocado nesta rodada).

Suposições:
- *(suposição)* **O handler de `getDisplayMedia` é um quebra-galho:** sem ele o Chromium dentro do Electron recusa a captura (`NotSupportedError`), e o ticket exige transmitir tela. Ele usa o seletor do sistema onde existe (Wayland pelo portal, macOS 15) e, fora disso, a primeira tela, sem áudio. O seletor do app, com janelas, miniaturas e áudio por aplicativo, é o DESK-07. Em X11 e no Windows isso captura a tela inteira sem perguntar qual.
- *(suposição)* O endereço do servidor fica no `localStorage` do renderer até o DESK-06 (o ticket dizia "em memória"; assim o app não pergunta a cada abertura).
- *(suposição)* O CSP abre `connect-src` para `https:`, `wss:` e `localhost`/`127.0.0.1`, porque o servidor é escolhido em tempo de execução. No DESK-06, com o endereço no main, dá para fechar na origem escolhida.
- *(suposição)* No `.deb` o `chrome-sandbox` precisa ser SUID para o sandbox do Chromium; os testes rodaram com `--no-sandbox`. O instalador do deb cuida disso no `postinst`; confirmar numa instalação real (DESK-10).
- *(suposição)* O `electron` não baixa o binário no `npm install` com o bloqueio de scripts do npm 11; foi preciso `node node_modules/electron/install.js` uma vez (anotado no `AGENTS.md`).
- *(suposição)* Nos testes do client, o Vitest passou a usar no máximo 6 workers: com todos os núcleos nos arquivos jsdom o Chromium das stories ficava sem CPU e histórias que esperam animações do Radix falhavam ao acaso (`pointer-events: none`). Com o limite, 3 rodadas seguidas passaram. A história `Delete Server` também ganhou um `waitFor`.
- Não validado: o Wayland real (o portal de captura) e o Windows; os testes foram em X11 (Xvfb). Quem usa Wayland deve abrir `npm run desktop` e conferir a transmissão com o seletor do portal.
- Ícones (pedido do usuário, 2026-10-28): um master, `packages/client/src/shared/assets/brand/icons/source.png` (480x480), e uma pasta por plataforma gerada dele com `npm run icons -w @gameplay/client` (`scripts/generate-icons.mjs`, com `icon-gen` e `sharp`):
  - `web/`: `favicon.ico` (16, 32 e 48), `icon-192.png` e `apple-touch-icon.png` (180). O `index.html` do web e o do desktop os referenciam (no build saem com hash).
  - `windows/`: `icon.ico` (16 a 256) e `icon.png`. O Forge usa o `.ico` como ícone do executável (`packagerConfig.icon`, escolhido pelo sistema em que roda).
  - `macos/`: `icon.icns` (16 a 512) e `icon.png`. O `.icns` é o ícone do bundle; o PNG serve ao Dock quando o app roda sem empacotar.
  - `linux/`: `icon.png` (512). Vai no `.deb` (`/usr/share/pixmaps/gameplay.png` e `Icon=gameplay`, conferido byte a byte) e na janela (importado com `?inline` no main, só no Linux).
  - O `favicon.svg` padrão do Vite (o raio roxo) saiu dos dois `public/`.
  - Não validado: o empacotamento do Windows (precisa de wine para gravar o ícone no `.exe`) nem o do macOS (o download do Electron para darwin falhou aqui); só os arquivos foram conferidos (`file`). *(suposição)* O master tem 480 px: os tamanhos de 512 do `.icns` e do PNG do Linux são ampliados em 6%; um `.icns` nítido em 1024 pede um master maior ou um SVG. *(suposição)* No macOS o bundle exige `.icns`; o PNG sozinho só vale para o Dock em execução.
- Favicon fixo (decisão do usuário, 2026-10-28): a rotação do favicon por ícones de jogo do Lucide (hook, serviço, regra e os 3 specs, 12 testes) foi removida, porque sobrescrevia o ícone novo na aba a cada 10 segundos. O ícone da aba agora é o do `index.html` e não muda.
