# RT-03 · Módulo `voice`

> Pontos: 5 · Depende de: RT-02 · Branch `refactor/api-voice-module`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seção 2. As salas de voz (assentos, estado de voz, entrar e sair) são regra de produto que hoje mora no `realtime`.

## Escopo
- `modules/voice/`: `domain/seat`, `stores/room-state.store` (e a versão em memória), use cases `join-room`, `leave-room`, `update-voice-state`, `release-voice-seats`, com os specs (hoje `voice-rooms.use-case.spec.ts`).
- Os use cases avisam os clientes pela porta `RealtimeEmitter`.
- O gateway do `realtime` chama os use cases do `voice`.
- O `media` passa a usar o `voice` pela interface do módulo para consultar assentos e salas.

## Fora do escopo
Sinalização (RT-04). Estado do SFU (RT-05).

## Checklist
- [ ] Módulo `voice` com domínio, store, use cases e specs
- [ ] Gateway chamando o `voice`
- [ ] `media` usando o `voice` pela interface do módulo
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] Checklist comum do `README.md`
- [ ] E2E de salas de voz (entrar, sair, trocar de sala, mutar, limite de assentos) verdes
- [ ] Nenhum import de `modules/realtime` dentro de `modules/voice`

## Critério de aceite
As salas de voz funcionam como antes, com o módulo `voice` dono das regras e o `realtime` só repassando os eventos.
