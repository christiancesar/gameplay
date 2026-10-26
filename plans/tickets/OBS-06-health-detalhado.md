# OBS-06 · Health detalhado

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: BE-02, BE-07, BE-14 · Onda 1

## Contexto
O `/api/health` só roda `SELECT 1` no banco, sem timeout. Storage e TURN quebrados passam despercebidos. Decisão do usuário em 2026-10-26: endpoint de detalhes público, sem dados sensíveis (nada de IP, host ou mensagem de erro), como base para uma página de status no estilo de status.claude.com mais tarde.

## Escopo
- `/api/health` continua leve (processo e banco), agora com timeout de 2 s. É o que o Docker e o deploy usam.
- `/api/health/details`, público: status geral (`operational`, `degraded`, `outage`), hora da checagem e um item por componente com status e latência:
  - `database`: `SELECT 1`;
  - `storage`: escrita, leitura e remoção de um arquivo de teste (local) ou `HeadBucket` (S3);
  - `turn`: só quando o provider não é STUN puro; emite credenciais para um usuário de teste, com o resultado guardado por 5 minutos para não chamar a Cloudflare a cada consulta.
- Banco ou storage fora derrubam o geral (`outage`, HTTP 503). TURN fora ou componente lento (acima de 1 s) deixa `degraded` (HTTP 200).
- O relatório inteiro fica em cache por 10 s e checagens simultâneas reaproveitam a mesma execução, para o endpoint público não virar carga.

## Fora do escopo
Página de status no web (histórico, incidentes): ticket futuro. Alerta e synthetic check no Grafana (OBS-05).

## Checklist
- [x] `check()` nos drivers de storage
- [x] Saúde do TURN com cache
- [x] `/api/health/details` e timeout no `/api/health`
- [x] Specs e e2e
- [x] Commit

## Critério de aceite
Com storage sem permissão de escrita, `/api/health/details` responde 503 com `storage: outage` e o `/api/health` continua 200.

## Notas da execução (2026-10-26)

- `StorageProvider.check()`: o driver local grava, lê e apaga `.health/probe-<pid>` dentro do diretório de uploads; o S3 faz `HeadBucket` (só leitura, nada gravado por checagem); o in-memory tem `failing` para os testes.
- `src/common/health/probe.ts`: `withTimeout` e `probe()` (timeout de 2 s vira `outage`, acima de 1 s vira `degraded`). O erro é descartado de propósito, para o relatório público não vazar host nem mensagem.
- `IceHealthService` no módulo `ice`: emite credenciais para o id `health-check` no máximo a cada 5 minutos, com chamadas simultâneas aproveitando a mesma execução. Com `stun-only` não há o que checar e o `turn` some do relatório.
- `/api/health/details` público, cache de 10 s. `overallStatus` (regra pura): banco ou storage fora é `outage` (503); TURN fora ou componente lento é `degraded` (200).
- `/api/health` ganhou o timeout de 2 s e continua sem depender de serviço externo.
- Testes: 302 unitários da API (novos: `probe`, `overallStatus`, `IceHealthService`, `CheckHealthDetailsUseCase`, `check()` do driver local) e e2e de health e S3 (`check()` contra o s3mock, 503 com storage quebrado e `/api/health` 200 ao mesmo tempo).
- Ainda não foi para o host: precisa de `npm run host:start` (a API reinicia por alguns segundos).

Suposições:
- O arquivo de teste do storage local fica em `.health/` dentro dos uploads, que o nginx serve em `/uploads`. Ele existe por milissegundos e não tem conteúdo útil. *(suposição)*
- O `/api/health/details` não tem limite de requisições próprio (o controller pula o throttler); o cache de 10 s segura a carga. *(suposição)*
- Limites de 2 s (timeout) e 1 s (lento) iguais para todos os componentes. *(suposição)*
