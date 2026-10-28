# TEL-03 Sentry no renderer do desktop, projeto do Electron

## Escopo
- `apps/desktop` recebe `SENTRY_DSN` (projeto próprio do Electron), `SENTRY_ENVIRONMENT` e a versão do app no build (Vite `define`/`VITE_*` do renderer e constante no main).
- O renderer inicia a telemetria com esse DSN, direto ao ingest do Sentry; o CSP do app ganha o host do ingest em `connect-src`.
- `createTelemetry(config)` aceita a configuração vinda do `Platform` (o desktop passa a sua, o web usa `VITE_*`); sem DSN, `NoopTelemetry`.
- Aviso de que o app envia diagnósticos ao desenvolvedor (texto curto na tela de escolha do servidor, i18n EN e PT).

## Fora do escopo
Main process do Electron (TEL-04). Endpoint de configuração por servidor (não é mais necessário para o Sentry).

## Checklist
- [ ] Erro forçado no renderer do desktop aparece no projeto do Electron, com `environment` e `release`
- [ ] Sem DSN no build: nada é enviado
- [ ] CSP continua fechado, só com o host do ingest a mais
- [ ] Cypress do web igual
