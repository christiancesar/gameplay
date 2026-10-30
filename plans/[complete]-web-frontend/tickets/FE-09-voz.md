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
- `plans/[complete]-core-product/02-core-flows.md` F8
- `plans/[complete]-media-transport/media-transport-options.md`
- `plans/[complete]-backend/tickets/BE-12-salas-de-voz-e-sinalizacao.md`, `BE-14-ice-e-ip.md`
- `modules/rooms/views`

## Checklist
- [x] `MeshTransport` com testes sobre `RTCPeerConnection` falso
- [x] Store e ViewModels com `.spec.ts`
- [x] Teste manual com duas abas ou dois browsers
- [x] Commit

## Critério de aceite
Duas pessoas na mesma sala se ouvem; mute, deafen e volume funcionam; ir ao Hub não derruba a voz; cair a rede reconecta na mesma sala.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com os outros dois tickets da onda (FE-07, FE-09, FE-12), na branch `feature/web-routing`. Revisado pelo Opus, que rodou tudo junto: web 975 testes, api 282, Cypress 26 de 26.

- `shared/media`: interface `MediaTransport` (troca por SFU sem mexer em ViewModels e Views) e `MeshTransport` com uma `RTCPeerConnection` por pessoa, negociação "perfeita", só o id menor faz a primeira oferta, `epoch` por conexão para reconstruir sem confusão, peer que não conecta em 15 s vira `failed` e tenta de novo com `restartIce`. APIs do browser atrás de fábricas, com fakes nos testes.
- `WebAudioEngine` (volume por pessoa de 0 a 200 %, deafen no ganho geral, saída por `setSinkId`) e `SpeakingDetector` (RMS a cada 100 ms, segura 300 ms).
- `modules/rooms`: `VoiceSession` (entrar, trocar, sair, mute, deafen, volume, dispositivos, novas tentativas, renovação do ICE antes do TTL, volta para a sala quando o socket reconecta, encerra em `room:left`, `server:removed` e socket perdido). A store de voz espelha o estado para a UI. Vive fora do React, então a chamada continua ao voltar ao Hub e termina ao sair do layout logado ou da conta.
- Tela do servidor: entrar e trocar de sala, mute e deafen no card, quem fala na sidebar e o palco da sala na área principal.
- Ajuste do Opus: clicar numa sala de outro servidor estando conectado em outro (caminho pelo Hub) agora pede confirmação, como no F6.
- Teste manual do agente: dois Chromium headless com mídia falsa, usuários e servidor criados e apagados. Os dois chegam a `connected` com áudio nos dois sentidos, 6 de 6 execuções depois da correção de oferta simultânea. Mute aparece do outro lado, sair remove o bloco.
- Incidente: o agente rodou o `oxfmt` na raiz sem a config uma vez e reformatou cerca de 125 arquivos. Restaurou os que eram só formatação; nada de outro agente se perdeu e o `format:check` passa.

Suposições *(confirmar)*:
- Qualquer falha do microfone (negado, sem dispositivo, ocupado) entra só ouvindo, com o mesmo aviso. *(suposição)*
- Mute e deafen continuam ao trocar de sala e voltam ao normal ao sair; volumes ficam na memória da aba. *(suposição)*
- Clicar em mute estando em deafen também tira o deafen, como no Discord. *(suposição)*
- Se o ICE falhar, a chamada segue sem servidores ICE e tenta de novo a cada 15 s. *(suposição)*
- Depois de uma queda do socket a sessão só repete o `room:join`; as conexões de mídia não são refeitas. *(suposição)*
- Só faixas de áudio tocam; o FE-10 precisa separar o áudio da tela do áudio da voz. *(suposição)*
- Não testado: queda de rede real nos 30 s, TURN real e `setSinkId` trocando a saída de verdade.
