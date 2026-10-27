# Grafana Cloud

Dashboards do Gameplay, versionados em JSON. Os dados chegam pela API (OTLP, ver `infra/self-hosted/README.md`, seção Observabilidade).

| Arquivo | Dashboard | O que mostra |
|---|---|---|
| `dashboards/api.json` | Gameplay · API | requisições, status, latência por rota, queries do banco, event loop e heap do Node, logs de warn e error |
| `dashboards/realtime.json` | Gameplay · Realtime | sockets, usuários online, pessoas em sala, telas compartilhadas, desconexões por motivo, eventos do Socket.IO e logs de sala |
| `dashboards/media.json` | Gameplay · Call quality | qualidade das calls medida nos navegadores (Faro, no Loki): fatia via TURN, RTT, jitter e perda da voz, fps e resolução da tela recebida e enviada, e Web Vitals (LCP, INP, CLS) |

Todos têm três variáveis no topo: fonte de métricas (Prometheus), fonte de logs (Loki) e ambiente (`host`, `development`).

## Importar

1. No Grafana do stack, abra Dashboards > New > Import.
2. Envie o arquivo JSON (ou cole o conteúdo) e clique em Import.
3. Nas variáveis do topo, escolha `grafanacloud-<stack>-prom`, `grafanacloud-<stack>-logs` e o ambiente.

Importar de novo com o mesmo arquivo substitui o dashboard (o `uid` é fixo).

## Alertas

`alerts.json` tem as regras do grupo `gameplay-host` (pasta Gameplay, avaliado a cada minuto), todas sobre o ambiente `host`:

| Regra | Dispara quando | Severidade |
|---|---|---|
| API stopped sending telemetry | nenhuma telemetria da API por 5 min (processo fora, reiniciando ou sem rede) | critical |
| API 5xx above 5% | mais de 5% das requisições com erro do servidor por 5 min | critical |
| API event loop stalling | event loop p99 acima de 200 ms por 5 min | warning |
| Many dropped sockets | mais de 10 quedas de socket (`ping timeout`, `transport close`, `transport error`) em 5 min | warning |

Para aplicar (substitui o grupo inteiro), com um token de service account (role Editor):

```bash
python3 -c 'import json; d=json.load(open("infra/grafana/alerts.json")); print(json.dumps({"title":"gameplay-host","folderUid":"gameplay","interval":60,"rules":d["rules"]}))' \
  | curl -s -H "Authorization: Bearer $GRAFANA_SA_TOKEN" -H 'content-type: application/json' -H 'X-Disable-Provenance: true' \
    -X PUT https://<stack>.grafana.net/api/v1/provisioning/folder/gameplay/rule-groups/gameplay-host --data-binary @-
```

Criar regra por regra (`POST /alert-rules`) é recusado pelo Grafana Cloud numa pasta nova; o `PUT` do grupo funciona. As notificações seguem a política padrão do stack: sem contact point, os alertas aparecem só em Alerting > Alert rules.

## Editar

Mudanças feitas na interface do Grafana não voltam para o repositório. Para guardar, use Share > Export > Save to file e substitua o JSON aqui.
