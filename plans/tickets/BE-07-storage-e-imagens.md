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
- [x] O `Dockerfile` da API instala o runtime com `--omit=optional`; garantir que o binário do `sharp` para linux/alpine entre na imagem e testar o upload dentro do container
- [x] Consultar docs atuais do `sharp` e do `@aws-sdk/client-s3`
- [x] Contrato `StorageProvider` e os três drivers
- [x] `ImageProcessor` com testes: JPG, PNG e WebP válidos; arquivo com extensão falsa; acima de 2 MB; EXIF removido; dimensões finais
- [x] Testes do driver S3 contra MinIO (trocado pelo `adobe/s3mock`, ver notas)
- [x] Seleção do driver por env
- [x] Commit a cada passo verde

## Critério de aceite
Uma imagem enviada sai processada no driver configurado, e um arquivo que não é imagem é recusado mesmo com a extensão certa.

## Notas da execução
- Módulo global `src/modules/storage`: `StorageProvider` (`put`, `delete`, `publicUrl`), drivers `LocalStorageProvider`, `S3StorageProvider` e `InMemoryStorageProvider`, `ImageProcessor`, `imageKey()` e o decorator `UploadImage()` com `requireImageFile()`.
- Versões: `sharp` 0.35.5 e `@aws-sdk/client-s3` 3.1156 (docs consultadas no Context7). O `sharp` remove os metadados por padrão; o processador chama `autoOrient()` antes, para a foto não sair girada quando o EXIF some.
- `ImageProcessor.process(buffer, 'square256' | 'cover1280x720')`: recusa acima de 2 MB (413 `IMAGE_TOO_LARGE`), confere os magic bytes de JPG, PNG e WebP (415 `UNSUPPORTED_IMAGE`, também para GIF e arquivo corrompido), limita a decodificação a 50 MP (imagem pequena em bytes que expande para algo enorme) e gera WebP com `fit: cover`.
- Chave versionada pelo conteúdo: `<pasta>/<dono>/<sha256 16 chars>.webp`. A remoção do arquivo anterior ao trocar fica nos use-cases (BE-08 e BE-09), que conhecem a chave antiga.
- `UploadImage()`: multer em memória, campo `file`, limite de 2 MB (413 do próprio multer) e OpenAPI de multipart.
- Env: `STORAGE_DRIVER` (`local` padrão), `STORAGE_LOCAL_DIR`, `PUBLIC_UPLOADS_URL`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. Com `s3`, bucket e credenciais são obrigatórios na validação.
- Fora de produção, com driver local, a API serve o diretório em `/uploads` (`useStaticAssets` do Express, sem pacote extra). Em produção, o nginx. **Pendência para o web:** o Vite ainda não tem proxy; quando o frontend for ligado, `/api` e `/uploads` precisam apontar para a 3333.
- **MinIO trocado pelo `adobe/s3mock:5.2.3`:** a MinIO parou de publicar as imagens da edição comunitária (Docker Hub e quay.io recusam o pull). O s3mock é feito para testes, aceita qualquer credencial e está no compose de dev (porta 9090). O e2e do driver S3 cria o bucket, grava, lê de volta (tipo e `Cache-Control`) e apaga.
- **Docker:** o runner instala com `--omit=optional` (para não levar o CLI do Prisma), o que também deixava de fora os binários do `sharp`. Agora eles são instalados à parte na versão do lockfile, para a plataforma da imagem. Testado dentro do container x64: WebP 256x256 sem EXIF. Imagem: 494 MB para 548 MB. **Não testado em arm64.**

