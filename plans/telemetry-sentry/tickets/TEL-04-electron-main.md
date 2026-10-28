# TEL-04 Main do Electron no Sentry

Depende do PR #26 (`feature/desktop-app`) e do TEL-03.

## Escopo
- `@sentry/electron/main` com o DSN do endpoint do TEL-03: exceções e rejeições do main, minidump de crash nativo, `render-process-gone`.
- Logs do pino que importam (warn, error, áudio e captura) como Sentry Logs; `main.log` local continua.
- Id anônimo da instalação e `userId` quando houver sessão. Sem conteúdo de áudio.
- Filtrar o ruído de `devtools://` no log.
- Validar Replay no renderer do Electron; se der problema, desligar só no desktop.

## Fora do escopo
Source maps do desktop (DESK-11). Opt-out nas configurações.

## Checklist
- [x] Erro forçado no main aparece no Sentry
- [x] Crash nativo simulado aparece no Sentry (minidump)
- [x] Sem DSN no servidor: o app só escreve o `main.log`
- [x] Specs do que for puro; app empacotado conferido

## Notas da execução (2026-10-28)

- `@sentry/electron` 8.3 em `modules/telemetry/`: uma interface `MainTelemetry` (`captureError`, `log`, `flush`), `SentryMainTelemetry` e `NoopMainTelemetry`, para o main também trocar de destino num lugar só. O `Sentry.init` roda antes do `app` ficar pronto.
- Os logs do pino de `info` para cima viram Sentry Logs por `pinoTelemetryStream` (um stream do multistream). `debug`, como o console do renderer, fica só no arquivo.
- Privacidade: `dataCollection: { userInfo: false, cookies: false }`, `server_name` e dados de usuário removidos no `beforeSend`. O Sentry dá a instalação um id anônimo próprio. Sem DSN no build o main não envia nada.
- Verificado com o app empacotado contra um servidor local: chegaram o log de início, a sessão e os eventos de processo filho do Chromium (`'GPU' process exited`, porque o teste foi num Xvfb sem GPU).
- Ajustes no log local: `render-process-gone` com `clean-exit` (janela fechada normalmente) deixou de ser erro, e o ruído de `devtools://` saiu.
- Fora do escopo e pendente: source maps do main e do renderer (DESK-11). O slug do projeto (`gameplay-electron`) já está no `apps/desktop/.env`. Não testado: um crash nativo de verdade (minidump).

### Traces e métricas no main (2026-10-28)

O README de início dizia que o main não tinha traces nem métricas. Era o que eu tinha implementado, e não um limite do SDK. Agora: `tracesSampleRate` 0.1 com `startupTracingIntegration()` (a abertura do app como trace), e `MainTelemetry.measure` (uma distribuição por valor, marcada `app: desktop` e `process: main`). A primeira métrica é `audio_share.linked` (o áudio de aplicativos ligou ou não, por modo), medida em `audioHandlers`. Verificado no app empacotado contra um servidor local: o app inicia sem erro e manda logs, sessão e eventos; o trace de abertura é amostrado (10%) e não apareceu nas duas execuções. Métricas só saem quando alguém compartilha.

**Corrigido a pedido do usuário, seguindo a documentação do Sentry para Electron:** a janela inicia o Sentry com `@sentry/electron/renderer` em volta do `@sentry/react` (`Platform` entrega o `sentry.start`, que o client chama no lugar do `Sentry.init`), sem DSN, e os eventos vão por IPC ao main. O `preload.ts` importa `@sentry/electron/preload`, porque o main empacotado não injeta o script sozinho. `@sentry/react` ficou fixo em `11.8.0`, a versão exata que o `@sentry/electron` 8.3 usa (com 11.9.0 haveria dois núcleos do SDK com portadores globais separados). Verificado no app empacotado contra um servidor local: a janela tem `window.__SENTRY_IPC__`, e um erro lançado nela chegou ao servidor como evento do cliente `sentry.javascript.electron`, pelo main. O crash nativo de verdade não foi testado.

### Controle do tamanho do log local (2026-10-28)

Pedido do usuário: o `main.log` não pode crescer sem controle. Antes, a rotação só acontecia na abertura do app, então uma sessão longa ou um erro em laço podia encher o disco. Agora:
- `RotatingFileStream` troca o arquivo durante a execução: ao passar de 5 MB, `main.log` vira `.1` e os mais velhos sobem, ficando 3 anteriores. O teto em disco é de cerca de 20 MB, faça o app o que fizer. Cada linha é gravada na hora (nenhuma se perde num crash). Um spec grava uns 40 MB e confere o teto.
- O arquivo recebe só `info` para cima (o `debug` do console do renderer não chega a ele).
- `RateLimiter`: no máximo 30 erros ou avisos do console por minuto e por janela; o resto é descartado, e o log diz quantos ficaram de fora. Mensagens passam a ser cortadas em 2000 caracteres.
- O mesmo limite vale para o que sobe ao Sentry como log, que sai do mesmo fluxo.

## Correção depois do primeiro release (2026-10-28)

O `@sentry/electron` registra o esquema `sentry-ipc` com `protocol.registerSchemesAsPrivileged` na inicialização e **substitui** o registro anterior; só protege as chamadas seguintes (ele troca a função por um proxy que junta os esquemas). O `registerAppScheme()` rodava antes do Sentry, então o `app://` perdeu o `secure`: a página deixou de ser contexto seguro (`isSecureContext` falso) e `navigator.mediaDevices` ficou indefinido, o que aparecia como "Você entrou só ouvindo" (microfone). Corrigido chamando `registerAppScheme()` **depois** do `createTelemetryModule`, ainda antes do `ready`. Conferido no app empacotado: `isSecureContext` verdadeiro e `getUserMedia({ audio: true })` devolve a faixa. Regra: qualquer SDK que registre esquemas privilegiados tem de iniciar antes do nosso registro.
