# RT-05 · `media` dono do SFU e do consumo

> Pontos: 5 · Depende de: RT-03 · Branch `refactor/api-media-owns-sfu`, saída da `dev`

## Contexto
`../02-tech-plan.md`, seções 1 e 2. O `media` importa o estado do SFU e erros de dentro do `realtime`, e duas regras de mídia moram no `realtime`.

## Escopo
- Mover para o `media`: `domain/sfu-session`, `stores/sfu-session.store` (e a versão em memória), os erros de realtime usados pelo `media`, e os use cases `report-media-usage` e `apply-media-change`, com os specs.
- O gateway do `realtime` chama o `media` para `media:usage`; o `apply-media-change` passa a reagir ao evento de domínio dentro do `media`.
- Renomear `RealtimeUsageService`, `RealtimeUsageProvider` e afins para `CloudflareUsage*` (decisão em aberto no tech plan, seção 4: confirmar o nome antes).
- O `media` deixa de importar o `RealtimeModule`.

## Fora do escopo
Mudar onde ficam as configurações de mídia (`limits`).

## Checklist
- [ ] Estado e domínio do SFU no `media`
- [ ] `report-media-usage` e `apply-media-change` no `media`
- [ ] Renomeação do consumo da Cloudflare
- [ ] `media.module.ts` sem o `RealtimeModule`
- [ ] Commit a cada passo verde

## Checklist de validação
- [ ] Checklist comum do `README.md`
- [ ] E2E de SFU, de recursos de mídia e de consumo (`sfu.e2e-spec.ts`, `media-resources.e2e-spec.ts`) verdes
- [ ] Nenhum import de `modules/realtime` dentro de `modules/media`
- [ ] Transmissão pelo SFU no self-hosted funcionando (manual: publicar, assistir, parar)

## Critério de aceite
O `media` é dono de tudo do SFU e não depende do `realtime`.
