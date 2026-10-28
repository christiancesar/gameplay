# TEL-03 Configuração de monitoramento pelo servidor

## Escopo
- API: `GET /api/monitoring/config` público, com `{ provider, dsn, environment, release, tunnel } | null`, a partir das envs do host. Contrato em `@gameplay/contracts`.
- Client: `Platform.server` lê a configuração depois de escolher o servidor e inicia a telemetria; sem configuração, `NoopTelemetry`.
- Web: decidir se segue com `VITE_*` ou lê o mesmo endpoint.
- `apps/desktop`: o renderer passa a enviar erros e telemetria pelo tunnel do servidor escolhido.

## Fora do escopo
Main process do Electron (TEL-04).

## Checklist
- [ ] Endpoint com teste e2e e sem dados além do que o DSN já expõe
- [ ] Desktop com servidor que tem Sentry: um erro forçado no renderer aparece no Sentry
- [ ] Desktop com servidor sem Sentry: nada é enviado
- [ ] Cypress do web igual
