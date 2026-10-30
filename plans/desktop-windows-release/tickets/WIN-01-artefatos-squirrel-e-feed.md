# WIN-01 · Artefatos Squirrel e feed

> Pontos: 5 · Depende de: DESK-11 · Branch `feature/windows-update-feed`, saída da `dev`

## Escopo

- Confirmar localmente quais artefatos o `MakerSquirrel` produz.
- Ajustar o workflow para preservar `Setup.exe`, `.nupkg`, `RELEASES` e demais arquivos exigidos pelo Squirrel.
- Documentar o formato do feed e a URL esperada pelo `autoUpdater`.
- Publicar os artefatos de teste num prefixo S3 imutável.
- Prototipar o endpoint read-only `GET /api/updates/windows/stable/RELEASES`.
- Confirmar que a página `/download` pode apontar para o mesmo catálogo sem expor credenciais.
- Não criar ainda o módulo de atualização no Electron.

## Fora do escopo

Assinatura, compra de certificado, `autoUpdater`, UI de atualização e rollback automatizado.

## Checklist

- [x] Artefatos Squirrel listados e versionados
- [x] Workflow preserva os artefatos necessários
- [ ] Download sem autenticação confirmado
- [ ] S3 testado como origem
- [x] Endpoint estável testado
- [x] Limitações e decisão de endpoint documentadas
- [x] Checksum e formato de cache registrados

## Critério de aceite

Existe uma release de teste cujo feed e pacote podem ser baixados por HTTPS por um cliente externo, ou existe uma decisão documentada e validada para o endpoint mais simples que falta.

## Notas da execução

- O workflow Windows agora valida e preserva `RELEASES`, `*.nupkg`, `*Setup.exe` e o ZIP manual. A publicação GitHub inclui os arquivos Squirrel como histórico da versão.
- A API ganhou `GET /api/updates/windows/:channel/RELEASES`. Para `stable`, ele redireciona para `${WINDOWS_UPDATE_FEED_BASE_URL}/stable/RELEASES`; canais não configurados respondem 404.
- O S3 continua sendo a origem dos arquivos. O feed `RELEASES` redirecionado mantém as referências relativas aos `.nupkg` no mesmo prefixo público do bucket.
- O endpoint não aceita upload e não expõe credenciais. `WINDOWS_UPDATE_FEED_BASE_URL` é opcional em desenvolvimento e obrigatório na implantação que disponibilizar o canal.
- _(suposição)_ O bucket/CDN fornecerá `RELEASES` e os `.nupkg` sem autenticação de leitura, com `Cache-Control: no-cache` para `RELEASES` e cache imutável para os pacotes versionados.
- _(pendência externa)_ O upload real no S3 ainda depende do bucket, prefixo, região/endpoint e credenciais do ambiente `electron-production`. Não foi marcado como validado localmente.
