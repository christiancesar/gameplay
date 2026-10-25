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
- Schemas no `packages/shared`: perfil, preferências e o formato do relatório de hardware (2.12), que o web usa para enviar.
- Teto e arredondamento do `deviceMemory`, conforme 2.12, validados no schema.

## Fora do escopo
Resumo de hardware para o admin (BE-15), troca de senha (sem "esqueci minha senha" no MVP; a redefinição é do admin).

## Referências
- `plans/00-requirements.md` 2.7, 2.11 e 2.12
- `plans/02-core-flows.md` (Configurações > Conta, Hardware)
- `plans/04-tech-plan.md` seção 2

## Checklist
- [ ] Rotas de perfil e preferências, com testes
- [ ] Upload e remoção de avatar (e2e com `InMemoryStorageProvider`)
- [ ] `DeviceReport`: modelo, migration, use-cases e testes (novo dispositivo, mesmo dispositivo atualiza, manual preservado na nova coleta)
- [ ] Schemas no `packages/shared` e OpenAPI
- [ ] Commit a cada passo verde

## Critério de aceite
O usuário altera tema, idioma e avatar, e cada dispositivo tem um único relatório atualizado a cada coleta, sem perder o que foi informado à mão.
