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
- [ ] Erro forçado no main aparece no Sentry
- [ ] Crash nativo simulado aparece no Sentry (minidump)
- [ ] Sem DSN no servidor: o app só escreve o `main.log`
- [ ] Specs do que for puro; app empacotado conferido
