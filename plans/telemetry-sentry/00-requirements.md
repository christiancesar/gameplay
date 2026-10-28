# Telemetria no Sentry: requisitos

## Problema

Hoje o front-end tem dois serviços que se sobrepõem. O Sentry pega erros. O Grafana Faro pega Web Vitals, sessões, traces do browser e as medições de qualidade de chamada. Dois SDKs, dois tunnels no nginx, dois destinos para olhar. Além disso:

- O app desktop (Electron) não manda nada para nenhum dos dois. O build do Forge não recebe as `VITE_*` que o Dockerfile do web injeta, então `initSentry` e `initFaro` ficam desligados. Confirmado no log do nginx (nenhuma chamada de `/monitoring/*` com o UA do Electron) e no `app.asar`.
- O main process do desktop só escreve em `main.log`. Um crash nativo (por exemplo do venmic) não chega a lugar nenhum.

## Objetivo

1. **Um destino para o front-end: o Sentry**, com erros, logs, traces e métricas, no web e no renderer do desktop.
2. **O main do desktop também no Sentry** (`@sentry/electron`): exceções, crashes nativos e os logs do `main.log` que importam.
3. **Uma porta `Telemetry` no client**, com o Sentry como provedor atual e o Faro como provedor reserva atrás da mesma interface, para trocar depois mudando configuração e não código de tela.
4. **O desktop aprende o que o servidor tem ligado em tempo de execução**, porque o mesmo binário fala com vários servidores self-hosted, cada um com o seu Sentry.

## Fora do escopo

- A API continua com OTel para o Grafana Cloud (logs, traces, métricas). Enviar os spans da API ao Sentry (OTLP) fica para depois.
- Tirar o Faro do código: o provedor fica escrito e testado, só deixa de ser usado.
- Pipeline de source maps do desktop (entra no DESK-11, junto com a release).

## Decisões já tomadas (usuário, 2026-10-28)

- Focar no Sentry e ver como a ferramenta funciona; o Faro volta a ser opção mais para frente.
- Os erros do Electron vão para o Sentry (centralizar tudo lá).
- A troca de provedor tem que ser fácil: interface própria, sem tipos do Sentry ou do Faro nas ViewModels.
- O usuário criou **um projeto novo no Sentry só para o Electron** (main e renderer do app instalado). Então o app desktop manda para esse projeto, o do desenvolvedor, e não para o Sentry do servidor self-hosted escolhido. O web continua no projeto `gameplay-project-sentry`.

## Pontos que o usuário ainda precisa confirmar

1. O dashboard `infra/grafana/dashboards/media.json` ("Gameplay · Call quality") é todo feito sobre as medições do Faro no Loki (`service_name="gameplay-web"`, `kind="measurement"`). Ao migrar, ele deixa de receber dados. *(suposição)* durante a transição os dois provedores escrevem ao mesmo tempo (composto), até existir o painel equivalente no Sentry; depois o dashboard do Grafana é aposentado.
2. Custo no Sentry: logs, spans e métricas são cobrados por volume. Ver o plano da conta antes de ligar tudo em produção, e começar com amostragem baixa de traces.
3. Com o projeto do desenvolvedor, os erros do desktop saem sempre para ele, qualquer que seja o servidor escolhido. Isso pede um aviso claro (e talvez um opt-out nas configurações) antes de distribuir o app para quem hospeda o próprio servidor. *(suposição)* no MVP vai ligado, sem opt-out.
4. DSN do projeto do Electron (recebido em 2026-10-28): `https://2e38f12abc2393b25ad4f136a4f57cc8@o4512302586658816.ingest.us.sentry.io/4512331486920704`, projeto `4512331486920704` na organização `o4512302586658816`. Vai em `apps/desktop/.env.example` no TEL-03. O slug do projeto só é preciso para subir source maps (DESK-11).
