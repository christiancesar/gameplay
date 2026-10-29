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

- [ ] Artefatos Squirrel listados e versionados
- [ ] Workflow preserva os artefatos necessários
- [ ] Download sem autenticação confirmado
- [ ] S3 testado como origem
- [ ] Endpoint estável testado
- [ ] Limitações e decisão de endpoint documentadas
- [ ] Checksum e formato de cache registrados

## Critério de aceite

Existe uma release de teste cujo feed e pacote podem ser baixados por HTTPS por um cliente externo, ou existe uma decisão documentada e validada para o endpoint mais simples que falta.
