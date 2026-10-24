# BE-07 · Storage e processamento de imagens

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: BE-02 · Onda 3

## Contexto
Avatar, ícone e cover são opcionais. O upload vai até 2 MB, em JPG, PNG ou WebP, com o tipo validado pelos magic bytes. O `sharp` processa:
- avatar e ícone: recorte quadrado, WebP 256 px;
- cover: WebP 16:9 em 1280x720;
- todos: sem EXIF.

O driver é escolhido por `STORAGE_DRIVER=local | s3`, e o banco guarda só a chave.

## Escopo
- `StorageProvider` (abstract class, ver `04-tech-plan.md` seção 3), com as implementações:
  - `LocalStorageProvider`, que grava no diretório do volume; a URL é `/uploads/<chave>`, servida pelo nginx (em dev, `ServeStatic` do Nest);
  - `S3StorageProvider`, com o SDK v3; a URL vem do bucket ou do CDN;
  - `InMemoryStorageProvider`, para os testes.
- `ImageProcessor` com os perfis `square256` e `cover1280x720`, validação de magic bytes e limite de tamanho.
- Interceptor ou pipe de upload multipart (`@nestjs/platform-express` com limite de 2 MB) reutilizável.
- Chave com conteúdo versionado (exemplo: `avatars/<userId>/<hash>.webp`), para o cache não servir imagem antiga, e remoção do arquivo anterior ao trocar.
- Variáveis no `EnvService`: `STORAGE_DRIVER`, `STORAGE_LOCAL_DIR`, `PUBLIC_UPLOADS_URL`, `S3_*`.
- MinIO no compose de teste para os testes do driver S3.

## Fora do escopo
Endpoints de avatar (BE-08) e de ícone e cover (BE-09).

## Referências
- `plans/00-requirements.md` 2.7 e 4
- `plans/04-tech-plan.md` seções 1 e 3

## Checklist
- [ ] O `Dockerfile` da API instala o runtime com `--omit=optional`; garantir que o binário do `sharp` para linux/alpine entre na imagem e testar o upload dentro do container
- [ ] Consultar docs atuais do `sharp` e do `@aws-sdk/client-s3`
- [ ] Contrato `StorageProvider` e os três drivers
- [ ] `ImageProcessor` com testes: JPG, PNG e WebP válidos; arquivo com extensão falsa; acima de 2 MB; EXIF removido; dimensões finais
- [ ] Testes do driver S3 contra MinIO
- [ ] Seleção do driver por env
- [ ] Commit a cada passo verde

## Critério de aceite
Uma imagem enviada sai processada no driver configurado, e um arquivo que não é imagem é recusado mesmo com a extensão certa.
