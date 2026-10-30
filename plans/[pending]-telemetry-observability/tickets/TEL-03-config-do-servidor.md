# TEL-03 Sentry no renderer do desktop, projeto do Electron

## Escopo
- `apps/desktop` recebe `SENTRY_DSN` (projeto próprio do Electron), `SENTRY_ENVIRONMENT` e a versão do app no build (Vite `define`/`VITE_*` do renderer e constante no main).
- O renderer inicia a telemetria com esse DSN, direto ao ingest do Sentry; o CSP do app ganha o host do ingest em `connect-src`.
- `createTelemetry(config)` aceita a configuração vinda do `Platform` (o desktop passa a sua, o web usa `VITE_*`); sem DSN, `NoopTelemetry`.
- Aviso de que o app envia diagnósticos ao desenvolvedor (texto curto na tela de escolha do servidor, i18n EN e PT).

## Fora do escopo
Main process do Electron (TEL-04). Endpoint de configuração por servidor (não é mais necessário para o Sentry).

## Checklist
- [x] Erro forçado no renderer do desktop aparece no projeto do Electron, com `environment` e `release`
- [x] Sem DSN no build: nada é enviado
- [x] CSP continua fechado, só com o host do ingest a mais
- [x] Cypress do web igual

## Notas da execução (2026-10-28)

- **Escopo ajustado:** sem endpoint `GET /api/monitoring/config`, porque o desktop usa um projeto do Sentry próprio e fixo no build. O nome do arquivo do ticket ficou como estava.
- `apps/desktop/.env` (`VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`) vale para a janela e para o main. O renderer lê pelo Vite; o main recebe os mesmos valores por `define` em `vite.main.config.ts`. A versão (`VITE_APP_VERSION`) vem do `package.json`, e o release é `gameplay-desktop@<versão>`.
- **CSP:** nada a mudar, o `connect-src` já aceita `https:`.
- A tela de escolha do servidor mostra, quando há DSN, que o app envia relatórios de erro ao desenvolvedor (`serverChoice.diagnostics`, EN e PT, com story). *(suposição)* sem opt-out no MVP; antes de distribuir para quem hospeda o próprio servidor, vale um interruptor nas configurações.
- `apps/desktop/vitest.config.ts` ganhou o alias `@/` do client para os specs do renderer.
- Verificado no app empacotado, com um servidor local no lugar do ingest do Sentry e o Chrome DevTools Protocol: o cliente Sentry da janela está ativo com o DSN, `environment`, `release`, `tracesSampleRate` e a tag `app: desktop`.
