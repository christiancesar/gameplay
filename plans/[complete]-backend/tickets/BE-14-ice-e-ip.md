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
- `plans/[complete]-core-product/00-requirements.md` 2.13, 3.1 e 3.1.1 (região do TURN)
- `plans/[complete]-backend/04-tech-plan.md` seções 1 e 3

## Checklist
- [x] Consultar docs atuais da API de TURN do Cloudflare Realtime
- [x] Três providers, com testes (Cloudflare com o HTTP mockado; coturn com o HMAC verificado)
- [x] Endpoint com e2e (`requestIp` vindo do `X-Forwarded-For` atrás do proxy confiável)
- [x] Seleção por env
- [x] Commit

## Critério de aceite
Trocar `ICE_PROVIDER` muda as credenciais devolvidas sem mudar código, e o `requestIp` respeita o proxy confiável.

## Notas da execução
- Módulo `src/modules/ice`: `IceProvider` com `CloudflareIceProvider`, `CoturnIceProvider` e `StunOnlyIceProvider`, escolhido por `createIceProvider()` a partir do `ICE_PROVIDER`.
- `GET /api/ice` (com sessão) responde `{ iceServers, ttlSeconds, requestIp }`. `urls` sempre vem como lista. `ttlSeconds` é 0 com STUN só.
- **Cloudflare** (docs atuais conferidas): `POST https://rtc.live.cloudflare.com/v1/turn/keys/<CLOUDFLARE_TURN_KEY_ID>/credentials/generate-ice-servers` com `Bearer <CLOUDFLARE_TURN_API_TOKEN>` e `{ ttl }`. As URLs na porta 53 são removidas, porque o browser bloqueia e elas só esperam o timeout. Timeout de 5 s na chamada.
- **coturn**: esquema da REST API (`use-auth-secret`). O usuário é `<expiração unix>:<userId>` e a senha é `base64(HMAC-SHA1(COTURN_SECRET, usuário))`. Nada fica guardado. O STUN de `STUN_URLS` vai junto das `COTURN_URLS`.
- **Cache**: em memória, por usuário. A credencial é reaproveitada enquanto resta mais da metade do TTL, e a resposta traz o TTL que sobra. Com mais de uma instância da API cada uma tem seu cache, o que só gera chamadas a mais.
- **Falha do provider**: a rota responde só STUN com `ttlSeconds: 60` e registra um aviso, para a entrada na sala não travar. O web pede de novo depois. *(Suposição minha: cair para STUN em vez de responder erro.)*
- **IP**: `TRUST_PROXY_HOPS` liga o `trust proxy` do Express (padrão 0). Com 1, o `request.ip` é o último endereço do `X-Forwarded-For`, o que o nginx ou o cloudflared acrescentou; um valor forjado pelo cliente antes dele é ignorado. O prefixo `::ffff:` de IPv4 é removido. **Em produção, atrás do nginx, usar `TRUST_PROXY_HOPS=1`.** Isso também corrige o IP usado pelo throttler, que antes via sempre o proxy.
- Env: `ICE_PROVIDER` (padrão `stun-only`), `STUN_URLS` (lista separada por vírgula, padrão `stun:stun.cloudflare.com:3478`), `ICE_TTL_SECONDS` (padrão 86400, entre 60 e 172800), `CLOUDFLARE_TURN_KEY_ID`, `CLOUDFLARE_TURN_API_TOKEN`, `COTURN_URLS`, `COTURN_SECRET`. A validação exige as variáveis do provider escolhido.
- Contrato em `packages/contracts/src/realtime/ice.ts`.
