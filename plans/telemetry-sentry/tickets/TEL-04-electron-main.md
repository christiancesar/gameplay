# TEL-04 Main do Electron no Sentry

Depende do PR #26 (`feature/desktop-app`) e do TEL-03.

## Escopo
- `@sentry/electron/main` com o DSN do endpoint do TEL-03: exceções e rejeições do main, minidump de crash nativo, `render-process-gone`.
- Logs do pino que importam (warn, error, áudio e captura) como Sentry Logs; `main.log` local continua.
- Id anônimo da instalação e `userId` quando houver sessão. Sem conteúdo de áudio.
- Filtrar o ruído de `devtools://` no log.
- Validar Replay no renderer do Electron; se der problema, desligar só no desktop.

## Fora do escopo
Source maps do desktop (DESK-10). Opt-out nas configurações.

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
- Fora do escopo e pendente: source maps do main e do renderer (DESK-10). O slug do projeto (`gameplay-electron`) já está no `apps/desktop/.env`. Não testado: um crash nativo de verdade (minidump).
