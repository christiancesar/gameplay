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
- `plans/[complete]-core-product/02-core-flows.md` padrões globais, F1 item 6, F4 item 6
- `plans/[complete]-backend/tickets/BE-06-limites-e-configuracoes.md`, `BE-14-ice-e-ip.md`
- `modules/browser-support/views`

## Checklist
- [x] Detecções como rules puras com testes
- [x] Commit

## Critério de aceite
Os avisos aparecem nos casos certos e somem ao dispensar.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com os outros dois tickets da onda (FE-07, FE-09, FE-12), na branch `feature/web-routing`. Revisado pelo Opus, que rodou tudo junto: web 975 testes, api 282, Cypress 26 de 26.

- Alerta de browser (não Chromium ou abaixo do `minChromiumVersion` de `/settings/public`) acima do formulário de login, pelo espaço `notice` do `AuthLayoutView`. Dispensado vale para a aba (sessionStorage).
- No painel de notificações do Hub, os avisos do ambiente vêm primeiro: browser, VPN ou proxy, aceleração gráfica desligada e permissão de monitores. O "permitir monitores" pede a permissão e envia o hardware de novo.
- VPN: IP público pelo STUN (candidatos `srflx`, 3 s de limite) comparado com o `requestIp` do `/api/ice`, uma vez por sessão.
- Aceleração gráfica: aviso quando não há WebGL ou o renderer é por software (SwiftShader, llvmpipe).
- Favicon gira entre gamepad-2, joystick, swords, dice-5, trophy e ghost a cada 10 s (Lucide, emerald-500), pausa com a aba escondida e não gira com `prefers-reduced-motion`. Título da página virou "Gameplay".

Suposições *(confirmar)*:
- VPN só compara endereços da mesma família (IPv4 com IPv4); sem par da mesma família não há aviso. *(suposição)*
- Renderer WebGL desconhecido não dispara o aviso de aceleração; WebGL ausente dispara. *(suposição)*
- O alerta do login e o aviso do Hub dividem a mesma dispensa. *(suposição)*
- O aviso de monitores só aparece com a permissão em `prompt`; depois de negar some. *(suposição)*
- Cor do favicon emerald-500. *(suposição)*
