# FE-09 · Salas de voz (mesh WebRTC)

> Pontos: 8 · Modelo sugerido: Opus · Depende de: FE-05, FE-06 · Onda 5

## Contexto
Clicar numa sala entra nela. A conexão de voz vive numa store e sobrevive à navegação para o Hub. Transporte em mesh, atrás da interface `MediaTransport` para trocar por SFU depois.

## Escopo
- `shared/media`: `MediaTransport` e `MeshTransport` (offer/answer e candidatos pelo socket, ICE de `GET /api/ice`, renovação pelo TTL).
- `modules/voice` (ou `rooms`): store de voz (sala atual, participantes, estado de conexão por peer), entrar, trocar e sair da sala, reconectar em até 30 s.
- Mute, deafen (silencia também o microfone), volume por pessoa, indicador de quem fala.
- Microfone negado: entra só ouvindo, com aviso.
- Participante "conectando" e erro com nova tentativa automática.
- Aviso de troca de servidor estando em sala (o FE-06 lê esta store).

## Fora do escopo
Transmissão de tela (FE-10), SFU.

## Referências
- `plans/02-core-flows.md` F8
- `plans/media-transport-options.md`
- `plans/tickets/BE-12-salas-de-voz-e-sinalizacao.md`, `BE-14-ice-e-ip.md`
- `modules/rooms/views`

## Checklist
- [ ] `MeshTransport` com testes sobre `RTCPeerConnection` falso
- [ ] Store e ViewModels com `.spec.ts`
- [ ] Teste manual com duas abas ou dois browsers
- [ ] Commit

## Critério de aceite
Duas pessoas na mesma sala se ouvem; mute, deafen e volume funcionam; ir ao Hub não derruba a voz; cair a rede reconecta na mesma sala.
