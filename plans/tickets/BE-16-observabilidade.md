# BE-16 · OpenTelemetry e Grafana Cloud

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: BE-02 · Onda 3

## Contexto
O backend exporta traces, métricas e logs para o Grafana Cloud free, com os logs pino em JSON. Os traces do browser (Sentry) se ligam aos do Nest pelo `tracePropagationTargets` apontando para `/api`.

## Escopo
- `src/lib/otel.ts`, carregado antes do Nest (flag `--require` no start ou import no topo do `main.ts`), com auto-instrumentação de HTTP, Express, Prisma e pino.
- Exportação OTLP configurada por env (`OTEL_EXPORTER_OTLP_ENDPOINT`, cabeçalhos de auth), e desligada quando ausente (dev sem Grafana).
- `trace_id` e `span_id` nos logs pino.
- Atributos de serviço: nome, versão e ambiente.

## Fora do escopo
Dashboards e alertas no Grafana, Sentry no web.

## Referências
- `plans/00-requirements.md` 5
- `plans/04-tech-plan.md` seção 1

## Checklist
- [ ] Consultar docs atuais do OpenTelemetry Node SDK e da instrumentação do Prisma 7
- [ ] SDK inicializado antes do Nest
- [ ] Exportação desligada sem env, e ligada com env (validar com um coletor local ou com o Grafana)
- [ ] Ids de trace nos logs
- [ ] Commit

## Critério de aceite
Uma requisição a `/api/health` gera um trace com o span do banco no destino configurado, e o log da requisição carrega o mesmo `trace_id`.
