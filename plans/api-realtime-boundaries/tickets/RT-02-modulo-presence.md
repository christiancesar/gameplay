# RT-02 · Módulo `presence`

> Pontos: 3 · Depende de: RT-01 · Branch `refactor/api-presence-module`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seção 2. A presença (quem está online) é usada pelo `realtime` e pelo `platform-admin`, que hoje importa o store de dentro do `realtime`.

## Escopo
- `modules/presence/`: `presence.store` e a versão em memória, e os use cases de marcar online, offline e consultar.
- O `connect-socket` e o `disconnect-socket` do `realtime` chamam o `presence`.
- O `platform-admin` usa o `presence` pela interface do módulo, não mais pelo `realtime`.
- Specs e contexto de teste do `presence` em `modules/presence/test/`.

## Fora do escopo
Voz, sinalização e mídia.

## Checklist
- [ ] Módulo `presence` com store, use cases e specs
- [ ] `realtime` e `platform-admin` usando o `presence`
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] Checklist comum do `README.md`
- [ ] Nenhum import de `modules/realtime` no `platform-admin`
- [ ] E2E de presença (online e offline na lista do admin e no servidor) verdes

## Critério de aceite
A presença tem módulo próprio e o `platform-admin` deixa de depender do `realtime`.
