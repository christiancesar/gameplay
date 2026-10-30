# Tickets: fronteiras do `realtime` na API

Base: `../02-tech-plan.md`. Uma branch por ticket, saída da `dev`, PR de volta para a `dev`. Sem mudança de comportamento em nenhum ticket. Commit a cada passo verde. Ao terminar: checklist marcado, "Notas da execução" com as suposições marcadas como *(suposição)*, status aqui e `plans/PROGRESS.md`. Parar depois de cada ticket para a revisão do usuário.

Checklist de validação comum a todos os tickets (além do específico de cada um):
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` verdes
- [ ] `npm test -w api` com o mesmo número de testes de antes ou mais (anotar antes e depois)
- [ ] `npm run test:e2e -w api` verde (precisa do `npm run db:up` em `apps/api`)
- [ ] AsyncAPI e OpenAPI gerados sem diferença em relação à `dev`
- [ ] `git diff --stat dev` mostrando os arquivos movidos como renomeados (R)

| Ticket | Pontos | Onda | Status |
|---|---|---|---|
| [RT-01 Porta do emissor e regra de lint](RT-01-porta-emissor-e-lint.md) | 3 | 1 | pendente |
| [RT-02 Módulo `presence`](RT-02-modulo-presence.md) | 3 | 2 | pendente |
| [RT-03 Módulo `voice`](RT-03-modulo-voice.md) | 5 | 3 | pendente |
| [RT-04 Módulo `signaling`](RT-04-modulo-signaling.md) | 2 | 3 | pendente |
| [RT-05 `media` dono do SFU e do consumo](RT-05-media-dono-do-sfu.md) | 5 | 4 | pendente |
| [RT-06 Gateway fino, desconexão e lint estrito](RT-06-gateway-fino.md) | 3 | 5 | pendente |
