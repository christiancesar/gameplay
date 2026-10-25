# FE-12 · Avisos do ambiente e favicon

> Pontos: 3 · Modelo sugerido: Haiku · Depende de: FE-03 · Onda 4

## Contexto
Avisos que dependem do browser e da rede, mostrados no SignIn e no Hub.

## Escopo
- Browser não Chromium ou abaixo da versão mínima (rota pública da API); alerta dispensado não volta na mesma sessão.
- VPN ou proxy: comparar o IP do STUN com o `requestIp` de `GET /api/ice`.
- Aceleração gráfica desligada.
- Favicon em rotação com ícones Lucide da categoria gaming.

## Fora do escopo
Bloquear o uso; os avisos só informam.

## Referências
- `plans/02-core-flows.md` padrões globais, F1 item 6, F4 item 6
- `plans/tickets/BE-06-limites-e-configuracoes.md`, `BE-14-ice-e-ip.md`
- `modules/browser-support/views`

## Checklist
- [ ] Detecções como rules puras com testes
- [ ] Commit

## Critério de aceite
Os avisos aparecem nos casos certos e somem ao dispensar.
