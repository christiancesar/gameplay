# Grafana Cloud

Dashboards do Gameplay, versionados em JSON. Os dados chegam pela API (OTLP, ver `infra/host/README.md`, seção Observabilidade).

| Arquivo | Dashboard | O que mostra |
|---|---|---|
| `dashboards/api.json` | Gameplay · API | requisições, status, latência por rota, queries do banco, event loop e heap do Node, logs de warn e error |
| `dashboards/realtime.json` | Gameplay · Realtime | sockets, usuários online, pessoas em sala, telas compartilhadas, desconexões por motivo, eventos do Socket.IO e logs de sala |

Todos têm três variáveis no topo: fonte de métricas (Prometheus), fonte de logs (Loki) e ambiente (`host`, `development`).

## Importar

1. No Grafana do stack, abra Dashboards > New > Import.
2. Envie o arquivo JSON (ou cole o conteúdo) e clique em Import.
3. Nas variáveis do topo, escolha `grafanacloud-<stack>-prom`, `grafanacloud-<stack>-logs` e o ambiente.

Importar de novo com o mesmo arquivo substitui o dashboard (o `uid` é fixo).

## Editar

Mudanças feitas na interface do Grafana não voltam para o repositório. Para guardar, use Share > Export > Save to file e substitua o JSON aqui.
