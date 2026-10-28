# Telemetria no Sentry: epic brief

Quem opera um servidor quer abrir um lugar só (o Sentry) e ver o que quebrou, o que ficou lento e como estão as chamadas, tanto de quem usa o navegador quanto de quem usa o app desktop. Hoje metade está no Sentry, metade no Grafana Faro, e o desktop não aparece em nenhum.

O front-end passa a falar com uma porta `Telemetry`, e o Sentry é o provedor ligado. O desktop descobre o que o servidor escolhido tem ligado e envia pelo mesmo caminho do web (o tunnel do nginx). O main process do Electron envia erros e crashes direto ao Sentry. O Faro continua escrito atrás da mesma porta, desligado, para voltar quando fizer sentido.

Pronto quando: um erro forçado no web, no renderer do desktop e no main do desktop aparece no Sentry do servidor; um trace do browser continua na API; as medições de chamada aparecem como métricas; e trocar o provedor é mudar a configuração.
