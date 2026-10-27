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
                 └── packages/desktop-bridge  (canais IPC com zod, usado pelo preload, pelo main e pelo client)
```

### 3.1 A porta `Platform`

Interface no `packages/client` (`shared/platform/platform.ts`), entregue por um context na raiz do app. Cada casca injeta a sua implementação.

```ts
type CaptureSource = { id: string; name: string; kind: 'screen' | 'window'; thumbnail: string | null }

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
    listSources(): Promise<CaptureSource[]>
    start(request: { sourceId: string | null; audio: boolean; video: MediaTrackConstraints }): Promise<ScreenCaptureResult>
  }
  /** Endereço do servidor: o próprio domínio no web, o escolhido pelo usuário no desktop. */
  server: { baseUrl(): string }
}
```

- ViewModels usam a `Platform`. As Views continuam só com props: recebem as `capabilities` e a lista de fontes já prontas. A regra do MVVM não muda.
- O `acquireScreen` de hoje (`shared/media/screen-capture.ts`) vira a implementação browser de `capture.start`.
- No Storybook e nos specs, uma `FakePlatform` (um arquivo, como os outros fakes) simula as duas plataformas.

### 3.2 IPC tipado (`packages/desktop-bridge`)

Cada canal tem schema zod de entrada e de saída. O tipo da ponte sai dos schemas.

```ts
// packages/desktop-bridge/src/channels.ts
export const desktopChannels = {
  'capture:list-sources': { input: z.object({}), output: z.array(captureSourceSchema) },
  'capture:select-source': { input: z.object({ sourceId: z.string(), audio: z.boolean() }), output: z.object({ ok: z.boolean() }) },
  'app:server-url': { input: z.object({}), output: z.object({ url: z.url().nullable() }) },
} as const
type Channels = typeof desktopChannels
export type DesktopBridge = {
  [K in keyof Channels]: (input: z.input<Channels[K]['input']>) => Promise<z.output<Channels[K]['output']>>
}
```

- **Preload**: `contextBridge.exposeInMainWorld('gameplayDesktop', bridge)`, montado a partir do contrato. Expõe funções, nunca o `ipcRenderer`.
- **Main**: um helper registra cada `ipcMain.handle` pelo contrato, **valida a entrada com zod** e confere o `senderFrame` (só a janela do app, só o protocolo do app).
- **Client**: a `DesktopPlatform` chama `window.gameplayDesktop` e importa só tipos do `desktop-bridge`.
- Helper próprio em vez de electron-trpc ou tipc: poucos canais, o mesmo padrão de zod do `contracts`, nenhuma dependência nova.

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

1. **Endereço da API em tempo de execução.** Hoje `http.ts` usa `baseURL: '/api'`, o socket conecta no mesmo domínio e o Better Auth usa o domínio da página. No desktop a página vem do protocolo do app (`app://`), então os três passam a ler `platform.server.baseUrl()`. No web continua o mesmo domínio.
2. **Autenticação por token no desktop** (decisão do usuário em 2026-10-27). O Better Auth client continua **no renderer**, com o mesmo código do web: login, 2FA, sessão e admin não mudam. O main só **guarda o token**.
   - Por quê: no web a sessão é um cookie `HttpOnly`. No desktop a página vem de `app://` e a API de `https://`, então o cookie seria de terceiro (exigiria `SameSite=None` e CORS com credenciais). Sem cookie, o lugar do renderer seria o `localStorage`, em texto puro no disco e legível por qualquer script da página. O `safeStorage` criptografa com o cofre do sistema (keyring no Linux, DPAPI no Windows, Keychain no macOS).
   - Fluxo: com o plugin `bearer` na API, o login devolve o token; o renderer manda para o main (`auth:set-token`), que criptografa e grava. Na abertura, o renderer pede o token (`auth:get-token`) e configura o Better Auth client, o `http` e o handshake do socket com `Authorization: Bearer`. O logout apaga (`auth:clear-token`).
   - O web segue com cookie. *(conferir a doc do plugin `bearer` antes)*
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
│   │   │   ├── main.tsx           monta <App platform={browserPlatform} />
│   │   │   ├── browser-platform.ts
│   │   │   └── index.css          @import do tema do client, @source do pacote
│   │   ├── index.html, vite.config.ts (React, Tailwind, router plugin apontando para o pacote, proxy /api)
│   │   ├── Dockerfile             passa a copiar packages/client
│   │   └── package.json
│   └── desktop/                   app Electron (Forge + plugin Vite)
│       ├── src/
│       │   ├── main/
│       │   │   ├── main.ts        janela, protocolo app://, CSP, trava de navegação
│       │   │   ├── ipc.ts         registra os canais do desktop-bridge com validação zod
│       │   │   ├── capture.ts     desktopCapturer e setDisplayMediaRequestHandler
│       │   │   ├── audio/         adaptadores de áudio por sistema (loopback, módulo nativo)
│       │   │   ├── server-url.ts  endereço do servidor escolhido
│       │   │   └── session-token.ts  token no safeStorage
│       │   ├── preload/
│       │   │   └── preload.ts     contextBridge com o contrato
│       │   └── renderer/
│       │       ├── main.tsx       monta <App platform={desktopPlatform} />
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
│   │   │   ├── modules/           os mesmos módulos de hoje (+ seletor de fontes no screen-share, tela de servidor no desktop)
│   │   │   ├── shared/
│   │   │   │   ├── platform/      platform.ts (porta), platform-context.tsx, test/fake-platform.ts
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

- **Token no desktop**: confirmar o plugin `bearer` do Better Auth e como ele convive com o 2FA e o admin.
- **Distribuição**: onde publicar os instaladores e os bundles da UI (GitHub Releases ou o bucket S3) e se haverá assinatura de código no Windows e macOS (certificados custam).
- **Push-to-talk global** (atalho fora da janela): entra depois, como mais uma capacidade da `Platform`.
