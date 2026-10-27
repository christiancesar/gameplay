# RT-04 · Módulo `signaling`

> Pontos: 2 · Depende de: RT-03 · Branch `refactor/api-signaling-module`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seção 2. O repasse entre pares do mesh (`signal`, `watch`, `unwatch`, `quality`) é o `relay-to-peer`, hoje no `realtime`.

## Escopo
- `modules/signaling/` com o `relay-to-peer` e os specs, usando o `voice` para saber se os dois estão na mesma sala e a porta `RealtimeEmitter` para entregar a mensagem.
- Os handlers `stream:watch`, `stream:unwatch`, `stream:quality` e `signal:send` do gateway chamam o `signaling`.

## Fora do escopo
SFU (RT-05).

## Checklist
- [ ] Módulo `signaling` com o use case e specs
- [ ] Gateway chamando o `signaling`
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] Checklist comum do `README.md`
- [ ] E2E de sinalização mesh e de transmissão mesh verdes
- [ ] Cypress de voz e transmissão no web verde (a sinalização é o que mais quebra em silêncio)

## Critério de aceite
A sinalização mesh funciona como antes, num módulo próprio.
