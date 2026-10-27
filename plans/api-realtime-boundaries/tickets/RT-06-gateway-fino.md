# RT-06 · Gateway fino, desconexão e lint estrito

> Pontos: 3 · Depende de: RT-04 e RT-05 · Branch `refactor/api-thin-gateway`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seção 3. Fechamento do épico.

## Escopo
- Gateway: cada handler valida o payload, monta o `who(socket)` e chama um use case de um provedor. Nenhuma regra no gateway.
- `disconnect-socket` orquestrando a limpeza pelos provedores na ordem de hoje: sinalização, SFU, voz, presença.
- Regra de lint do RT-01 passa de aviso a **erro**, e ganha a proibição de caminhos internos de outro módulo (`/stores/`, `/domain/`).
- `AGENTS.md` e `plans/04-tech-plan.md` com a regra: `realtime` é o endpoint do socket; os recursos são provedores.

## Fora do escopo
Qualquer mudança de evento ou payload.

## Checklist
- [ ] Gateway sem regra
- [ ] Desconexão orquestrada, com spec da ordem da limpeza
- [ ] Lint como erro, sem violações
- [ ] Docs atualizadas
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] Checklist comum do `README.md`
- [ ] `npm run lint -w api` sem avisos de import restrito
- [ ] E2E de desconexão (cair da sala com transmissão ativa limpa voz, mesh e SFU) verde
- [ ] Cypress de voz e transmissão no web verde

## Critério de aceite
O `realtime` é só a camada do socket, os recursos são provedores, e o lint impede que isso volte a se misturar.
