# Tickets: telemetria no Sentry

Base: `../02-tech-plan.md`. Uma branch por ticket, saída da `dev`, PR de volta para a `dev`. Commit a cada passo verde. Ao terminar: checklist marcado, "Notas da execução" com as suposições marcadas como *(suposição)*, status atualizado aqui e `plans/PROGRESS.md` atualizado. Parar depois de cada ticket para a revisão do usuário.

| Ticket | Pontos | Depende de | Status |
|---|---|---|---|
| [TEL-00 Arquivos de ambiente por aplicação](TEL-00-arquivos-de-ambiente.md) | 3 | | concluído |
| [TEL-01 Porta `Telemetry` e provedores](TEL-01-porta-telemetry.md) | 5 | | concluído |
| [TEL-02 Sentry completo no front: traces, logs e métricas](TEL-02-sentry-completo.md) | 5 | TEL-01 | pendente |
| [TEL-03 Sentry no renderer do desktop, projeto do Electron](TEL-03-config-do-servidor.md) | 3 | TEL-01 | pendente |
| [TEL-04 Main do Electron no Sentry](TEL-04-electron-main.md) | 5 | TEL-03, PR #26 | pendente |
| [TEL-05 Painel no Sentry e aposentar o Faro](TEL-05-painel-e-aposentar-faro.md) | 3 | TEL-02 | pendente |
