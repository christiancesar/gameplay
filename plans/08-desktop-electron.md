# 08. App desktop em Electron

Plano do app desktop e da migração do front-end para um pacote compartilhado. Só plano: nada implementado.

## 1. Objetivo

Compartilhar **janela, tela, jogo ou música com o áudio deles**, o que o browser não faz. O desktop existe para usar recursos do computador do usuário: captura de janelas com miniatura, áudio do sistema e áudio por processo, atalhos globais.

A UI é a mesma do web. Nada de componente reescrito: o que é feito para o web sai no desktop, e a diferença fica nas **capacidades da plataforma**.

## 2. Decisões (2026-10-27)

- **Electron** como app desktop.
- **A UI vai empacotada dentro do app**, não carregada da URL do servidor. Motivo: o app captura tela e áudio do computador. Uma página remota com acesso a essa ponte entregaria a captura a quem controlar o servidor (um servidor invadido ou um self-hosted mal-intencionado).
- **`packages/client`** recebe o front-end inteiro que hoje está em `apps/web/src`: Model, ViewModels, Views, Screens, rotas, `shared/` e testes. Não só as Views: elas são a menor parte do código, e deixar o resto no web obrigaria o desktop a reescrever ViewModels, services e transportes.
- **`apps/web`** e **`apps/desktop`** viram cascas finas sobre o `packages/client`.
- **`packages/desktop-bridge`**: contrato tipado do IPC entre o renderer e o processo main.
- **Scaffold: Electron Forge** (seção 3).

## 3. Forge, Fiddle e alternativas

**Electron Fiddle não é scaffold.** É um playground oficial para testar trechos de Electron, trocar de versão do Electron e reproduzir bugs. Não gera projeto, não empacota instalador, não publica. Serve para prototipar a captura (por exemplo, testar o `desktopCapturer` no Linux) antes de levar para o app.

**Electron Forge** é a ferramenta oficial para criar, empacotar e publicar o app:
- Mantida pelo time do Electron e ativa: `@electron-forge/cli` 8.0.1 (29/09/2026), depois da linha 7 (7.11.2 em 20/05/2026) e de uma série de alfas da 8 ao longo de 2026.
- `@electron-forge/plugin-vite` 8.0.1 declara `vite ^8.0.0`, a mesma versão do nosso monorepo.
- Template `vite-typescript`, makers por sistema (Squirrel e MSI no Windows, DMG e ZIP no macOS, deb e rpm no Linux), publishers (GitHub, S3) e integração com o `autoUpdater`, assinatura e notarização.
- Contra: a configuração é "do jeito do Forge"; o plugin de Vite historicamente andou atrás das versões do Vite e já foi marcado como experimental. Confirmar no spike (DESK-05).

**electron-vite + electron-builder** (comunidade) fica como plano B: Vite nativo com HMR no main e no preload (electron-vite 6.0.0, 14/10/2026) e o electron-builder (26.18.0, 26/10/2026), maduro para empacotar e atualizar. São duas ferramentas de terceiros.

## 4. Arquitetura

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

### 4.1 A porta `Platform`

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

### 4.2 IPC tipado (`packages/desktop-bridge`)

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

### 4.3 Como a captura chega ao WebRTC

O renderer continua usando o `getDisplayMedia` do Chromium. No desktop, o main intercepta o pedido com `session.setDisplayMediaRequestHandler` e responde com a fonte escolhida no nosso seletor (`desktopCapturer.getSources`). Assim `ShareSession`, `MeshTransport` e `SfuConnection` não mudam: recebem um `MediaStream` como hoje.

Áudio:
- **Sistema inteiro**: `audio: 'loopback'` no handler, **só no Windows** (documentação do Electron).
- **Por janela ou processo**: não existe no Electron. Exige módulo nativo por sistema: WASAPI process loopback (Windows), ScreenCaptureKit (macOS), um nó do PipeWire por aplicativo (Linux). O áudio chega ao renderer como uma faixa extra, que o `ShareSession` junta ao vídeo.
- **Linux**: com PipeWire o `desktopCapturer.getSources()` devolve uma fonte só, escolhida pelo seletor do sistema. Nosso seletor com miniaturas vale para Windows e macOS.

## 5. O que muda no client para rodar no desktop

1. **Endereço da API em tempo de execução.** Hoje `http.ts` usa `baseURL: '/api'`, o socket conecta no mesmo domínio e o Better Auth usa o domínio da página. No desktop a página vem do protocolo do app (`app://`), então os três passam a ler `platform.server.baseUrl()`. No web continua o mesmo domínio.
2. **Autenticação por token no desktop.** O cookie de sessão não serve entre `app://` e `https://`. Proposta: plugin `bearer` do Better Auth na API, token guardado pelo main com `safeStorage`, enviado no `http`, no Better Auth client e no handshake do socket. O web segue com cookie. *(conferir a doc do Better Auth antes)*
3. **Primeira abertura do desktop**: tela para informar o servidor (produção ou um self-hosted). Nova View e nova rota, com story.
4. **Versões diferentes entre app e servidor.** O `/api/health` passa a informar a versão mínima de app aceita; o desktop pede atualização quando estiver abaixo.
5. **Variáveis `VITE_*`** (Sentry, Faro): os tunnels `/monitoring/*` viram URLs absolutas do servidor no desktop.
6. **Router**: o TanStack Router continua com rotas por arquivo, agora em `packages/client/src/app/routes`. No desktop o protocolo do app devolve o `index.html` para qualquer caminho, então o histórico do browser funciona.
7. **Tailwind 4**: o CSS de cada casca aponta para o pacote (`@source "../../packages/client/src"`).

## 6. Source tree

### 6.1 Hoje

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

### 6.2 Alvo

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

## 7. Segurança do desktop

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity` ligado.
- CSP no protocolo do app: scripts só do próprio app; `connect-src` só para o servidor escolhido e a Cloudflare (TURN e SFU).
- Navegação travada: `will-navigate` e `setWindowOpenHandler` mandam links externos para o browser do sistema.
- Fuses do Electron pelo Forge (`RunAsNode` desligado, integridade do ASAR).
- O main valida toda entrada do IPC e só atende a janela do app.

## 8. Fases e tickets

Cada fase deixa o web funcionando como hoje.

| Ticket | O que é |
|---|---|
| DESK-01 | Este plano (estudo do app desktop). |
| DESK-02 | Mover `apps/web/src` para `packages/client` sem mudar comportamento. Storybook, Vitest, router plugin, Tailwind, Dockerfile e Cypress ajustados. Todos os testes e stories passando, deploy do web igual. |
| DESK-03 | Porta `Platform` no client, com a implementação browser (o `acquireScreen` de hoje) e a `FakePlatform` nos specs e stories. |
| DESK-04 | Servidor em tempo de execução e autenticação por token: `platform.server` no `http`, no socket e no Better Auth client; plugin `bearer` na API; web continua com cookie. |
| DESK-05 | Spike do Forge com plugin Vite 8 no monorepo (decide Forge ou plano B) e scaffold do `apps/desktop`: janela, protocolo `app://`, segurança da seção 7, renderer montando o client com a tela de escolha do servidor. |
| DESK-06 | `packages/desktop-bridge` e o IPC tipado, com os canais de app (endereço do servidor, token). |
| DESK-07 | Captura de janela e tela no desktop: canais `capture:*`, `setDisplayMediaRequestHandler`, seletor de fontes com miniaturas (View nova com story). |
| DESK-08 | Áudio do sistema pelo loopback no Windows. |
| DESK-09 | Áudio por janela ou processo com módulo nativo, no sistema escolhido primeiro. |
| DESK-10 | Empacotamento, assinatura, auto update e versão mínima do app no `/api/health`. |

## 9. Pendências

- **Qual sistema vem primeiro** para o áudio nativo (DESK-08 e DESK-09). O Windows é o caminho mais curto (loopback já existe; WASAPI para processo). O Linux é o ambiente do usuário, mas o mais trabalhoso.
- **Token no desktop**: confirmar o plugin `bearer` do Better Auth e como ele convive com o 2FA e o admin.
- **Distribuição**: onde publicar os instaladores (GitHub Releases ou o bucket S3) e se haverá assinatura de código no Windows e macOS (certificados custam).
- **Push-to-talk global** (atalho fora da janela): entra depois, como mais uma capacidade da `Platform`.
