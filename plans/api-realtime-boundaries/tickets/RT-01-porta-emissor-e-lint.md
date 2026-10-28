# RT-01 · Porta do emissor e regra de lint

> Pontos: 3 · Depende de: nada · Branch `refactor/api-realtime-emitter-port`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 2 e 3. Os provedores precisam avisar os clientes sem importar o `realtime`.

## Escopo
- `common/realtime/realtime-emitter.ts`: a porta abstrata (o que hoje é `providers/realtime-emitter/realtime-emitter.provider.ts`), com os mesmos métodos.
- O `realtime` registra a implementação Socket.IO como provider da porta, disponível para os outros módulos.
- Quem usa o emissor passa a importar a porta de `common/`. O fake do emissor vai para `common/realtime/test/`.
- Regra `no-restricted-imports` no `oxlint` da API proibindo `modules/realtime/` fora do próprio módulo, ligada como **aviso** (os imports de hoje somem nos próximos tickets; o RT-06 liga como erro).

## Fora do escopo
Mover stores, use cases ou domínio de lugar.

## Checklist
- [ ] Porta em `common/realtime/` e implementação Socket.IO registrada
- [ ] Usos do emissor apontando para a porta
- [ ] Fake do emissor em `common/realtime/test/`
- [ ] Regra de lint como aviso, listando os imports que ainda existem
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] Checklist comum do `README.md`
- [ ] `npm run lint -w api` mostra os avisos só nos imports esperados (media e platform-admin)

## Critério de aceite
Os provedores conseguem emitir pela porta, sem conhecer o Socket.IO, e o lint aponta o que falta separar.
