# BE-14 · Credenciais ICE/TURN e IP visto pelo HTTP

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: BE-04 · Onda 5

## Contexto
O provider de ICE é escolhido por env, sem mudar código: `ICE_PROVIDER=cloudflare | coturn | stun-only`. Na fase local usa o TURN do Cloudflare Realtime, com credenciais efêmeras; na EC2, coturn (credenciais por HMAC com segredo compartilhado). O mesmo endpoint devolve o IP visto pelo HTTP, para o web comparar com o IP do STUN e avisar de VPN ou proxy.

## Escopo
- `IceProvider` (abstract class) com `CloudflareIceProvider` (API de credenciais do Cloudflare Realtime TURN), `CoturnIceProvider` (REST API do coturn, usuário com tempo de expiração mais HMAC) e `StunOnlyIceProvider`.
- `GET /api/ice` autenticado, que responde `{ iceServers, ttlSeconds, requestIp }`.
- Variáveis no `EnvService` por provider. As credenciais do Cloudflare ficam só no servidor.
- Cache curto das credenciais por usuário, para não chamar a API do Cloudflare a cada entrada em sala *(suposição)*.

## Fora do escopo
Subir o coturn (infra da Fase 2), comparação de IP no web.

## Referências
- `plans/00-requirements.md` 2.13, 3.1 e 3.1.1 (região do TURN)
- `plans/04-tech-plan.md` seções 1 e 3

## Checklist
- [ ] Consultar docs atuais da API de TURN do Cloudflare Realtime
- [ ] Três providers, com testes (Cloudflare com o HTTP mockado; coturn com o HMAC verificado)
- [ ] Endpoint com e2e (`requestIp` vindo do `X-Forwarded-For` atrás do proxy confiável)
- [ ] Seleção por env
- [ ] Commit

## Critério de aceite
Trocar `ICE_PROVIDER` muda as credenciais devolvidas sem mudar código, e o `requestIp` respeita o proxy confiável.
