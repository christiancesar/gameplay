# BE-08 · Conta: perfil, avatar, preferências e hardware

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: BE-04, BE-07 · Onda 5

## Contexto
O usuário troca ou remove o próprio avatar. O tema (escuro padrão, ou claro) e o idioma (en ou pt) ficam lembrados por usuário. O hardware de cada dispositivo é coletado no login e quando o usuário pede, com um registro por dispositivo e complemento manual.

## Escopo
- Use-cases e rotas:
  - `GetMyProfile` e `UpdateMyProfile` (username de exibição, tema, idioma);
  - `UploadAvatar` e `RemoveAvatar`, com o `ImageProcessor` no perfil `square256`. O upload grava a URL pública em `user.image` (campo do Better Auth, lido pelo frontend em `session.user.image`) e a chave em `avatarKey`, usada para apagar o arquivo antigo na troca. O `/update-user` recusa `image` (BE-04), então esse endpoint é o único caminho.
- Modelo `DeviceReport` e use-cases:
  - `ReportDevice` (upsert por `userId + deviceId`, recebendo o que o browser coletou);
  - `UpdateDeviceManualInfo` (campos informados pelo usuário);
  - `ListMyDevices`.
- Schemas no `packages/contracts`: perfil, preferências e o formato do relatório de hardware (2.12), que o web usa para enviar.
- Teto e arredondamento do `deviceMemory`, conforme 2.12, validados no schema.

## Fora do escopo
Resumo de hardware para o admin (BE-15), troca de senha (sem "esqueci minha senha" no MVP; a redefinição é do admin).

## Referências
- `plans/[complete]-core-product/00-requirements.md` 2.7, 2.11 e 2.12
- `plans/[complete]-core-product/02-core-flows.md` (Configurações > Conta, Hardware)
- `plans/[complete]-backend/04-tech-plan.md` seção 2

## Checklist
- [x] Rotas de perfil e preferências, com testes
- [x] Upload e remoção de avatar (e2e com `InMemoryStorageProvider`)
- [x] `DeviceReport`: modelo, migration, use-cases e testes (novo dispositivo, mesmo dispositivo atualiza, manual preservado na nova coleta)
- [x] Schemas no `packages/contracts` e OpenAPI
- [x] Commit a cada passo verde

## Critério de aceite
O usuário altera tema, idioma e avatar, e cada dispositivo tem um único relatório atualizado a cada coleta, sem perder o que foi informado à mão.

## Notas da execução
- Módulo `src/modules/accounts`, com `ProfilesRepository` e `DeviceReportsRepository` (Prisma e in-memory).
- Rotas, todas com sessão:
  - `GET /api/me/profile`: id, email, username, `displayUsername`, `image`, tema e idioma.
  - `PATCH /api/me/preferences`: `theme` (`dark` ou `light`) e `locale` (`en`, `pt` ou `null` para seguir o browser). Só muda o que vier no corpo.
  - `PUT /api/me/avatar` (multipart, campo `file`) devolve `{ image }`; `DELETE /api/me/avatar` responde 204.
  - `POST /api/me/devices` com `{ deviceId, collected }` cria ou atualiza o relatório do dispositivo; `GET /api/me/devices` lista (coleta mais recente primeiro); `PUT /api/me/devices/:deviceId/manual` grava o que o usuário informou (404 `DEVICE_NOT_FOUND` se o dispositivo nunca enviou coleta).
- **Username fica fora do `UpdateMyProfile`:** a troca de username (e de `displayUsername`) continua pelo `/api/auth/update-user`, como decidido no BE-04, para manter a validação e a unicidade do plugin `username`. A rota própria cuida só de tema e idioma, por isso se chama `preferences`. *(Suposição minha, confirmar.)*
- Avatar: processa no perfil `square256`, grava em `avatars/<userId>/<hash>.webp`, salva a URL em `user.image` e a chave em `avatarKey`, e só então apaga o arquivo antigo. Se a mesma imagem for enviada de novo, a chave é a mesma e nada é apagado. Falha ao apagar o arquivo antigo vira log de aviso, sem derrubar a requisição. O e2e confere que o `get-session` já devolve a nova `image`.
- `DeviceReport`: tabela `device_report`, único por `(userId, deviceId)`, apagado em cascata com o usuário. O upsert troca `collected` e `collectedAt` e não mexe em `manual`.
- Schemas em `packages/contracts` (`account/profile.ts` e `account/device-report.ts`). Todos os campos coletados são obrigatórios e anuláveis, porque cada browser expõe um subconjunto; o web manda `null` no que não conseguiu ler. Textos até 200 caracteres e até 16 monitores.
- `deviceMemory`: a entrada é arredondada para baixo até uma potência de 2, entre 0,25 e 8 GB (o teto do Chrome). Um valor acima, como 32, vira 8 em vez de recusar o relatório inteiro. *(Suposição minha: arredondar em vez de recusar.)*
- Campos manuais: modelo do processador, RAM, placa de vídeo, VRAM, tipo de conexão (`wired`, `wifi`, `mobile`, `other`) e plano de internet (download e upload em Mbps). O `PUT` substitui o objeto inteiro.
- Monitores (Window Management API): `label`, `width`, `height`, `scaleFactor`, `refreshRate`, `isPrimary`, `isInternal`. A API do Chrome não expõe a taxa de atualização em todas as versões, por isso `refreshRate` é anulável.
