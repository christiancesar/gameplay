# 02 · Tech Plan: app desktop em Electron

> Data: 2026-10-27. Base: `00-requirements.md` e `01-epic-brief.md`. Tickets em `tickets/`.

## 1. Decisões técnicas (2026-10-27)

- **Electron** como app desktop.
- **A UI vai empacotada dentro do app**, não carregada da URL do servidor. Motivo: o app captura tela e áudio do computador. Uma página remota com acesso a essa ponte entregaria a captura a quem controlar o servidor (um servidor invadido ou um self-hosted mal-intencionado).
- **`packages/client`** recebe o front-end inteiro que hoje está em `apps/web/src`: Model, ViewModels, Views, Screens, rotas, `shared/` e testes. Não só as Views: elas são a menor parte do código, e deixar o resto no web obrigaria o desktop a reescrever ViewModels, services e transportes.
- **`apps/web`** e **`apps/desktop`** viram cascas finas sobre o `packages/client`.
- **`packages/desktop-bridge`**: contrato tipado do IPC entre o renderer e o processo main.
- **Scaffold: Electron Forge** (seção 2).
- **Linux é o primeiro sistema**; o Windows vem depois, para testar por lá. Áudio por aplicativo com **`@vencord/venmic`** e PipeWire.
- **Ordem do trabalho**: primeiro a migração (pacotes, web consumindo o `packages/client`, desktop rodando o mesmo client), sem os recursos nativos de captura. Os recursos nativos vêm depois, com o projeto já normalizado (`tickets/README.md`).

## 2. Forge, Fiddle e alternativas

**Electron Fiddle não é scaffold.** É um playground oficial para testar trechos de Electron, trocar de versão do Electron e reproduzir bugs. Não gera projeto, não empacota instalador, não publica. Serve para prototipar a captura (por exemplo, testar o `desktopCapturer` no Linux) antes de levar para o app.

**Electron Forge** é a ferramenta oficial para criar, empacotar e publicar o app:
- Mantida pelo time do Electron e ativa: `@electron-forge/cli` 8.0.1 (29/09/2026), depois da linha 7 (7.11.2 em 20/05/2026) e de uma série de alfas da 8 ao longo de 2026.
- `@electron-forge/plugin-vite` 8.0.1 declara `vite ^8.0.0`, a mesma versão do nosso monorepo.
- Template `vite-typescript`, makers por sistema (Squirrel e MSI no Windows, DMG e ZIP no macOS, deb e rpm no Linux), publishers (GitHub, S3) e integração com o `autoUpdater`, assinatura e notarização.
- A configuração do compilador é nossa: o plugin só orquestra os builds de main, preload e renderer, cada um com um `vite.*.config.ts` escrito por nós (aliases, React, Tailwind, router plugin). O que o DESK-05 confirma é o monorepo: o renderer importando o código-fonte do `packages/client`, o Tailwind enxergando o pacote e o router plugin gerando as rotas dele.

**electron-vite + electron-builder** (comunidade) fica como plano B: Vite nativo com HMR no main e no preload (electron-vite 6.0.0, 14/10/2026) e o electron-builder (26.18.0, 26/10/2026), maduro para empacotar e atualizar. São duas ferramentas de terceiros.

## 3. Arquitetura

```
                 packages/contracts        (zod e eventos do Socket.IO, já existe)
                         │
                 packages/client           (todo o front-end: MVVM, rotas, i18n, UI, testes)
                  │      ▲
        Platform  │      │ implementações
        (porta)   ▼      │
   apps/web ─────────────┘   browser: getDisplayMedia, sem áudio de janela
   apps/desktop ─────────┘   desktop: IPC pelo preload
        │
        ├─ renderer  (casca Vite que monta o packages/client)
        ├─ preload   (contextBridge: expõe só o contrato do desktop-bridge)
        └─ main      (desktopCapturer, áudio nativo, atalhos, janela, update)
                 ▲
                 └── packages/desktop-bridge  (canais IPC com zod, usado pelo preload e pelo main; o client só importa tipos)
```

### 3.1 A porta `Platform`

Interface no `packages/client` (`shared/platform/platform.ts`). Cada casca injeta a sua implementação: o `App` recebe a `platform` por prop. *(DESK-03 feito: o que está abaixo é o que existe no código.)*

```ts
type CaptureSource = { id: string; name: string; kind: 'screen' | 'window'; thumbnail: string | null }
type CaptureRequest = {
  /** O que o seletor do browser recebe: superfície, resolução, fps e áudio. */
  options: DisplayMediaStreamOptions
  /** Uma fonte escolhida em `listSources`; null deixa a escolha com o seletor do próprio host. */
  sourceId: string | null
}

type Platform = {
  kind: 'browser' | 'desktop'
  capabilities: {
    /** O app lista as fontes (com miniatura); no browser quem escolhe é o seletor dele. */
    listSources: boolean
    windowAudio: boolean
    systemAudio: boolean
    globalHotkeys: boolean
  }
  capture: {
    listSources: () => Promise<CaptureSource[]>
    start: (request: CaptureRequest) => Promise<ScreenCaptureResult>
  }
  server: {
    /** Origem da API, sem barra final. Vazia no web (página e API no mesmo domínio). */
    baseUrl: () => string
    /** Presente onde o usuário escolhe o servidor (o desktop): `current` é null até a primeira escolha. */
    chooser?: { current: () => string | null; choose: (origin: string) => void }
  }
}
```

- **Dois jeitos de ler**, porque parte do código vive fora do React: `usePlatform()` (context, `PlatformProvider`) nos componentes e `currentPlatform()` (registro de módulo, preenchido pelo `App`) nos controllers como o `share.controller`. A plataforma não muda enquanto o app roda.
- ViewModels usam a `Platform`. As Views continuam só com props: recebem as `capabilities` e a lista de fontes já prontas. A regra do MVVM não muda.
- **Camada nova no lint**: `shared/platform` é o tipo `shared-platform` nas fronteiras do oxlint; `model-service`, `view-model` e `app` podem importá-lo, e ele só importa `shared-lib` e `shared-media`.
- **O client define a interface; cada host a implementa** *(decisão do usuário em 2026-10-28, que corrigiu a primeira versão do DESK-03)*: `createBrowserPlatform` mora em `apps/web/src/browser-platform.ts` e `createDesktopPlatform` em `apps/desktop/src/renderer/desktop-platform.ts`, cada uma independente da outra. O client só conhece a `Platform`.
- **Peças que um host com navegador dentro divide** (o web e o desktop, cujo renderer é o Chromium): o client as exporta numa entrada à parte, `@gameplay/client/platform` (para os specs de um host não carregarem o front-end inteiro): `acquireScreen` (a captura pelo `getDisplayMedia`), `audioCapabilitiesOf` (o áudio que o browser consegue compartilhar, lido do navegador e do sistema) e os tipos. São blocos, não uma `Platform` pronta. Um host que não usa navegador (ou o desktop na fase 2, com captura nativa) simplesmente não os usa.
- No Storybook e nos specs, uma `FakePlatform` (`shared/platform/test/fake-platform.ts`, sem framework de teste dentro) simula as plataformas.

### 3.2 IPC tipado (`packages/desktop-bridge`)

*(feito no DESK-06; o que está abaixo é o que existe no código.)* Cada canal tem schema zod de entrada e de saída; o tipo da ponte sai dos schemas.

```ts
// packages/desktop-bridge/src/names.ts: só os nomes, para o preload não carregar zod
export const DESKTOP_CHANNELS = ['server:get-url', 'server:set-url'] as const

// packages/desktop-bridge/src/channels.ts
export const desktopChannels = {
  'server:get-url': { input: z.undefined(), output: serverOriginSchema.nullable() },
  'server:set-url': { input: serverOriginSchema, output: z.void() },
} as const satisfies Record<DesktopChannel, { input: z.ZodType; output: z.ZodType }>
```

- **Arquivos do pacote:** `names.ts`, `channels.ts` (schemas), `bridge.ts` (`createBridge` e o tipo `DesktopBridge`, uma função por canal, indexada pelo nome do canal: `bridge['server:get-url']()`), `register.ts` (`registerChannels`, do lado do main). Exporta o código-fonte, sem build; o preload importa só `@gameplay/desktop-bridge/bridge`.
- **`serverOriginSchema`** vem de `@gameplay/contracts` (`isServerOrigin`): exatamente uma origem, `https`, ou `http` só para esta máquina. A tela de escolha do client usa a mesma regra.
- **Preload** (`src/preload/preload.ts`): `contextBridge.exposeInMainWorld('gameplayDesktop', createBridge(ipcRenderer.invoke))`. Expõe uma função por canal e nada mais, nunca o `ipcRenderer`.
- **Main:** `registerChannels` registra só os canais do contrato, recusa a chamada que não vem do app (confere o `senderFrame`) e valida a entrada e a resposta com os schemas. O tipo `ChannelHandlers` pede um handler para cada canal do contrato, então um canal sem resposta não compila. Cada módulo de `main/modules/` traz os seus handlers.
- **Client:** a plataforma do desktop recebe a ponte (`window.gameplayDesktop`); o client só importa tipos.
- Helper próprio em vez de electron-trpc ou tipc: poucos canais, o mesmo padrão de zod do `contracts`, nenhuma dependência nova.
- **O que o main faz com o servidor escolhido** (`modules/server`): guarda em `userData/server.json`; o cookie só é reescrito para as respostas dele (`isOnServer`); e `app://gameplay/uploads/*` é buscado nele (as imagens que a API devolve têm URL relativa à página, que no desktop não leva a lugar nenhum).

### 3.3 Como a captura chega ao WebRTC

O renderer continua usando o `getDisplayMedia` do Chromium. No desktop, o main intercepta o pedido com `session.setDisplayMediaRequestHandler` e responde com a fonte escolhida no nosso seletor (`desktopCapturer.getSources`). Assim `ShareSession`, `MeshTransport` e `SfuConnection` não mudam: recebem um `MediaStream` como hoje.

Áudio:
- **Sistema inteiro**: `audio: 'loopback'` no handler, **só no Windows** (documentação do Electron).
- **Por janela ou processo**: não existe no Electron. Exige módulo nativo por sistema: WASAPI process loopback (Windows), ScreenCaptureKit (macOS), um nó do PipeWire por aplicativo (Linux). O áudio chega ao renderer como uma faixa extra, que o `ShareSession` junta ao vídeo.
- **Linux**: com PipeWire o `desktopCapturer.getSources()` devolve uma fonte só, escolhida pelo seletor do sistema. Nosso seletor com miniaturas vale para Windows e macOS.

### 3.4 Linux: o que o sistema oferece

Anotado para a fase 2; nada disso entra na migração.

- **Quem escolhe a janela é sempre o usuário que compartilha.** A diferença é de quem é a tela de escolha:
  - **X11**: o `desktopCapturer` lista telas e janelas com miniatura, e o seletor é nosso (como o do Discord).
  - **Wayland** (padrão do Ubuntu atual): o app não consegue listar as janelas de outros programas. A escolha passa pelo portal do sistema (`xdg-desktop-portal`, ScreenCast, sobre o PipeWire), que abre a janela de escolha do próprio GNOME ou KDE, e o app recebe só a fonte escolhida. O Discord no Wayland também cai nesse portal.
- **Áudio por aplicativo**: cada app que toca som é um nó no PipeWire, com `application.name` e `application.process.id`. O `@vencord/venmic` (7.2.3, módulo nativo, usado pelo Vesktop) cria um microfone virtual com o áudio dos apps escolhidos, sem o resto do sistema e sem a voz da call; o renderer captura esse microfone como uma faixa comum. Plano B sem módulo nativo: o main roda o `pw-record` no nó do app.
- **Duas escolhas no Linux**: no Wayland não dá para ligar a janela do portal a um processo. O fluxo fica em duas etapas: a janela ou tela, e o áudio numa lista nossa com os apps que estão tocando (um ou vários). No Windows, janela e processo se ligam pelo PID e as etapas podem virar uma.

## 4. O que muda no client para rodar no desktop

1. **Endereço da API em tempo de execução** *(feito no DESK-04)*. Antes, `http.ts` usa `baseURL: '/api'`, o socket conecta no mesmo domínio e o Better Auth usa o domínio da página. No desktop a página vem do protocolo do app (`app://`), então os três passam a ler `platform.server.baseUrl()`. No web continua o mesmo domínio.
2. **Sessão por cookie no desktop, igual ao web** *(decidido no DESK-05)*. O Better Auth client continua **no renderer**, com o mesmo código do web: login, 2FA, sessão e admin não mudam.
   - O problema: a página (`app://gameplay`) e o servidor (`https://...`) são de sites diferentes, então o cookie `SameSite=Lax` da sessão e o do desafio de 2FA (`two_factor`) não voltam.
   - A solução: o processo main reescreve o `Set-Cookie` das respostas que não são do app para `SameSite=None; Secure` (`session.webRequest.onHeadersReceived`, `modules/session/cookie-policy.ts`), sem mexer nos cookies do web. A API confia na origem `app://gameplay` (`DESKTOP_APP_ORIGIN` em `@gameplay/contracts`, em `trustedOrigins`) e responde com CORS e credenciais, no HTTP e no Socket.IO.
   - **Teste no Electron real (Xvfb, `app://gameplay` contra a API local):** escolha do servidor, login, desafio de 2FA do admin, sessão, `/api/*` e socket funcionaram só por cookie, sem erro. Por isso o **plugin `bearer` e o token saíram** (DESK-04 foi feito e depois desfeito no DESK-05): um mecanismo só, igual ao web, e sem token para guardar.
   - Limite: o cookie `Secure` só vale em HTTPS, `localhost` e `127.0.0.1`. Por isso o endereço do servidor aceita `http` só para esta máquina (`normalizeServerAddress`). Um servidor self-hosted em `http://<ip da rede>` não funciona no desktop; o web segue funcionando.
3. **Primeira abertura do desktop**: tela para informar o servidor (produção ou um self-hosted). Nova View e nova rota, com story.
4. **Versões diferentes entre app e servidor.** O `/api/health` passa a informar a versão mínima de app aceita; o desktop pede atualização quando estiver abaixo.
5. **Variáveis `VITE_*`** (Sentry, Faro): os tunnels `/monitoring/*` viram URLs absolutas do servidor no desktop.
6. **Router**: o TanStack Router continua com rotas por arquivo, agora em `packages/client/src/app/routes`. No desktop o protocolo do app devolve o `index.html` para qualquer caminho, então o histórico do browser funciona.
7. **Tailwind 4**: o CSS de cada casca aponta para o pacote (`@source "../../packages/client/src"`).

## 5. Source tree

### 5.1 Hoje

```
gameplay/
├── apps/
│   ├── api/
│   └── web/
│       ├── .storybook/            main.ts, preview.tsx
│       ├── cypress/               e2e, tasks (peer-bot)
│       ├── public/
│       ├── src/
│       │   ├── app/               app.tsx, router, root-layout, routes/, route-tree.gen.ts
│       │   ├── docs/              introduction.mdx
│       │   ├── fixtures/
│       │   ├── modules/           admin, auth, hub, rooms, screen-share, servers, settings, ...
│       │   ├── shared/            ui (shadcn), lib (http, socket, auth-client, sentry, faro), media, i18n, hooks, test
│       │   ├── index.css
│       │   └── main.tsx
│       ├── components.json, index.html, vite.config.ts, Dockerfile, cypress.config.ts
│       └── package.json
├── packages/
│   ├── contracts/
│   └── env/
└── infra/
```

### 5.2 Alvo

```
gameplay/
├── apps/
│   ├── api/                       + plugin bearer, versão mínima do app no /api/health
│   ├── web/                       casca do browser
│   │   ├── cypress/               fica aqui: e2e roda contra o web
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── main.tsx           monta <App platform={createBrowserPlatform()} />
│   │   │   ├── browser-platform.ts  a Platform do web, com o spec
│   │   │   └── index.css          @import do tema do client, @source do pacote
│   │   ├── index.html, vite.config.ts (React, Tailwind, router plugin apontando para o pacote, proxy /api)
│   │   ├── Dockerfile             passa a copiar packages/client
│   │   └── package.json
│   └── desktop/                   app Electron (Forge + plugin Vite)
│       ├── src/
│       │   ├── main/
│       │   │   ├── main.ts        janela, protocolo app://, CSP, trava de navegação
│       │   │   ├── ipc.ts         registra os canais de cada módulo com validação zod
│       │   │   └── modules/       um diretório por recurso do sistema
│       │   │       ├── session/   cookie do servidor atravessando entre sites (cookie-policy.ts)
│       │   │       ├── server/    o servidor escolhido, num arquivo do userData (handlers, services, providers, test)
│       │   │       ├── capture/   hoje o handler mínimo do getDisplayMedia; fase 2: desktopCapturer, portal e o seletor do app
│       │   │       ├── audio/     fase 2: áudio por aplicativo (venmic no Linux, WASAPI no Windows)
│       │   │       └── hardware/  futuro: CPU, GPU, RAM, aceleração por hardware
│       │   ├── preload/
│       │   │   └── preload.ts     contextBridge com o contrato
│       │   └── renderer/
│       │       ├── main.tsx       monta <App platform={createDesktopPlatform()} />
│       │       ├── desktop-platform.ts
│       │       └── index.css
│       ├── forge.config.ts        makers, publishers, fuses, plugin Vite
│       ├── vite.main.config.ts, vite.preload.config.ts, vite.renderer.config.ts
│       ├── index.html
│       └── package.json
├── packages/
│   ├── contracts/
│   ├── env/
│   ├── client/                    todo o front-end, compartilhado
│   │   ├── .storybook/            Storybook sai do web e vem para cá
│   │   ├── src/
│   │   │   ├── app/               App (recebe a Platform), router, root-layout, routes/, route-tree.gen.ts
│   │   │   ├── docs/
│   │   │   ├── fixtures/
│   │   │   ├── modules/           os mesmos módulos de hoje (+ `server-choice` para quem escolhe o servidor e, na fase 2, o seletor de fontes)
│   │   │   ├── shared/
│   │   │   │   ├── platform/      platform.ts (a interface), current-platform.ts, platform-provider.tsx, use-platform.ts, test/fake-platform.ts
│   │   │   │   ├── ui/            shadcn
│   │   │   │   ├── lib/           http, socket, auth-client lendo platform.server
│   │   │   │   ├── media/         screen-capture vira a implementação browser
│   │   │   │   ├── i18n/, hooks/, test/
│   │   │   └── styles/theme.css   o tema que hoje está no index.css
│   │   ├── components.json        shadcn passa a adicionar componentes aqui
│   │   ├── vitest.config.ts       projetos unit e storybook
│   │   └── package.json           "@gameplay/client", exporta o código-fonte (sem build)
│   └── desktop-bridge/
│       ├── src/
│       │   ├── channels.ts        canais com zod
│       │   ├── bridge.ts          tipo DesktopBridge e helpers de preload e main
│       │   └── index.ts
│       └── package.json           "@gameplay/desktop-bridge"
└── infra/
```

Módulos do main (`src/main/modules/<módulo>/`), no mesmo espírito dos módulos da API:
- `<módulo>.handlers.ts` traduz cada canal do IPC para o service, sem regra.
- `services/` guarda a lógica e depende de portas, não do Electron nem do sistema, para ser testado com fakes no Vitest.
- `providers/` implementa as portas por sistema ou tecnologia (por exemplo `audio/providers/venmic` e `audio/providers/wasapi`). O `main.ts` escolhe o provider pelo sistema e injeta pelo construtor, sem framework de DI.
- `test/` com fakes, seed e contexto em arquivos separados, como na API.
- Um módulo não importa outro; o que for comum chega por injeção no `main.ts`.
- Na fase 1 existem só `auth` e `server`. Os outros aparecem com os tickets deles.

Regras de dependência:
- `packages/client` não importa nada de `electron` nem de `apps/*`. Do `desktop-bridge`, só tipos.
- `apps/desktop/src/main` não importa nada do `packages/client`.
- As regras de camada do MVVM (`AGENTS.md`) valem dentro do `packages/client`.

## 6. Atualizações

O que muda define o caminho:
- **Atualização completa** (instalador novo): versão do Electron (o Chromium traz correções de segurança a cada 8 semanas, mais ou menos), main, preload, módulo nativo de áudio, contrato do `desktop-bridge`.
- **OTA da UI** (troca só o bundle do renderer): telas, ViewModels, services, transportes, i18n. É a maior parte das mudanças.

OTA da UI:
1. Cada release do client gera o bundle do renderer e um manifest com versão, hash e a **versão mínima do shell** (a do contrato do `desktop-bridge`).
2. O bundle é **assinado** com uma chave privada que fica só no CI ou na máquina de release; o app sai com a chave pública embutida.
3. O main busca bundle novo ao abrir e de tempos em tempos, confere assinatura e hash e guarda em `userData/ui/<versão>`.
4. O protocolo `app://` serve o bundle verificado mais novo compatível com o shell. Se falhar, volta ao anterior e, por último, ao que veio no instalador.
5. Bundle que exige shell mais novo não é aplicado; o app pede a atualização completa.

Regras:
- Sem assinatura não existe OTA: baixar UI sem verificar desfaria o motivo de empacotar a UI.
- O bundle vem só do nosso canal de releases (GitHub Releases ou o bucket S3), **nunca do servidor ao qual o usuário se conecta**. Um self-hosted não empurra UI para o app.

Atualização completa por sistema:
- **Windows e macOS**: `autoUpdater` do Electron com os makers do Forge (Squirrel, ZIP). `update.electronjs.org` serve repositório público no GitHub; a alternativa é o S3. No macOS exige app assinado e notarizado (conta Apple de US$ 99 por ano); no Windows funciona sem assinatura, com aviso do SmartScreen.
- **Linux**: o `autoUpdater` do Electron não roda no Linux. deb e rpm se atualizam pelo gerenciador do sistema; atualização sozinha exige AppImage com o `electron-updater`. No começo, aviso de versão nova com link, e o OTA cobre a UI.

## 7. Segurança do desktop

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity` ligado.
- CSP no protocolo do app: scripts só do próprio app; `connect-src` só para o servidor escolhido e a Cloudflare (TURN e SFU).
- Navegação travada: `will-navigate` e `setWindowOpenHandler` mandam links externos para o browser do sistema.
- Fuses do Electron pelo Forge (`RunAsNode` desligado, integridade do ASAR).
- O main valida toda entrada do IPC e só atende a janela do app.

## 8. Pendências

- **Servidor self-hosted em `http` fora desta máquina** não funciona no desktop (o cookie `Secure` exige HTTPS). Se for preciso, a alternativa é voltar ao token (ver o histórico do DESK-04) ou pôr HTTPS no servidor.
- **Rastreamento do Faro no desktop**: o Faro só propaga os headers de trace para a mesma origem; entre `app://` e o servidor seria preciso `propagateTraceHeaderCorsUrls`.
- **Distribuição**: onde publicar os instaladores e os bundles da UI (GitHub Releases ou o bucket S3) e se haverá assinatura de código no Windows e macOS (certificados custam).
- **Push-to-talk global** (atalho fora da janela): entra depois, como mais uma capacidade da `Platform`.
