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
- [x] Download sem autenticação configurado
- [x] S3 configurado como origem
- [x] Endpoint estável testado
- [x] Limitações e decisão de endpoint documentadas
- [x] Checksum e formato de cache registrados

## Critério de aceite

Existe uma release de teste cujo feed e pacote podem ser baixados por HTTPS por um cliente externo, ou existe uma decisão documentada e validada para o endpoint mais simples que falta.

## Notas da execução

- O workflow Windows agora valida e preserva `RELEASES`, `*.nupkg`, `*Setup.exe` e o ZIP manual. A publicação GitHub inclui os arquivos Squirrel como histórico da versão.
- A API ganhou `GET /api/updates/windows/:channel/:artifact`. Para `stable`, ela faz proxy de `RELEASES` e dos artefatos a partir de `${WINDOWS_UPDATE_FEED_BASE_URL}/stable`; canais e nomes inseguros respondem 404.
- O S3 continua sendo a origem dos arquivos. O proxy mantém as referências relativas aos `.nupkg` no mesmo prefixo do bucket sem expor o endereço do S3 ao cliente.
- O endpoint não aceita upload, não expõe credenciais e controla `Cache-Control`: `RELEASES` não é armazenado em cache e os pacotes versionados são imutáveis. `WINDOWS_UPDATE_FEED_BASE_URL` é opcional em desenvolvimento e obrigatório na implantação que disponibilizar o canal.
- O armazenamento reutiliza o bucket já criado pelo Terraform para uploads. Os arquivos do canal estável ficam no prefixo `updates/windows/stable`, sem criar um bucket novo.
- O GitHub Actions publica usando OIDC na role `gameplay-github-updates`, limitada a `s3:PutObject` no prefixo de updates. Não é necessário cadastrar access key AWS no GitHub.
- Para ativar o ambiente `electron-production`, serão necessários `AWS_ROLE_TO_ASSUME`, `AWS_REGION` e `WINDOWS_UPDATE_BUCKET`. Os dois últimos podem ser obtidos com os outputs Terraform `aws_region` e `uploads_bucket`; o primeiro com `github_updates_role_arn`.
- A role OIDC, o provedor GitHub e a policy do S3 foram aplicados no ambiente AWS. As variáveis `AWS_ROLE_TO_ASSUME`, `AWS_REGION` e `WINDOWS_UPDATE_BUCKET` foram cadastradas no ambiente GitHub `electron-production`, e o job `publish` passou a declarar esse ambiente.
- `WINDOWS_UPDATE_FEED_BASE_URL` foi configurada no `.env` de produção com a origem S3 sem o sufixo do canal. O deploy da API ainda precisa ser executado para carregar essa variável no container.
- _(suposição)_ O bucket continuará fornecendo leitura pública dos objetos de download, como já ocorre com os uploads atuais. O endpoint canônico para o cliente continuará sendo `https://gameplay.oikos.company/api/updates/windows/stable/RELEASES`.
- _(pendência externa)_ Ainda falta executar uma release de teste para validar o upload no S3, o download HTTPS real e o conteúdo do feed. A credencial S3 que apareceu acidentalmente durante uma inspeção deve ser rotacionada antes do deploy de produção.
