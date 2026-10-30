# BE-05 · Keys de cadastro (registration-invites)

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: BE-04 · Onda 5

## Contexto
Só se cadastra quem tem uma key, gerada pelo admin da plataforma. A key tem 6 caracteres alfanuméricos sem ambíguos (sem 0/O e 1/I), não diferencia maiúsculas, é de uso único, tem validade de 1, 7 ou 30 dias e pode ser revogada. Ela aparece uma única vez. O banco guarda o **HMAC-SHA256 com segredo do servidor** (`REGISTRATION_KEY_SECRET`) e o sufixo de 3 caracteres para a listagem.

## Escopo
- Modelo `RegistrationInvite` (ver `04-tech-plan.md` seção 2) e migration.
- Providers: `TokenGenerator` (alfabeto sem ambíguos, aleatório criptográfico) e `TokenHasher` (HMAC), cada um com interface e implementação.
- Use-cases, com repositório `prisma` e `in-memory`:
  - `GenerateRegistrationInvite`;
  - `ListRegistrationInvites` (sufixo, validade, status calculado: ativa, vencida, usada ou revogada; quem usou e quando; sem limpeza, tudo fica como registro);
  - `RevokeRegistrationInvite`;
  - `ConsumeRegistrationInvite`, que valida, marca como usada e é atômico contra uso duplo.
- Rotas de admin (`@PlatformAdmin()`): gerar, listar e revogar.
- Hook `before` do sign-up (`src/modules/auth/hooks/sign-up.hook.ts`, criado no BE-04, hoje só valida o formato) chamando o `ConsumeRegistrationInvite`. A key normalizada para maiúsculas. Se o sign-up falhar depois, a key não pode ficar queimada (transação, ou consumo no `after` com reserva; decidir no ticket).
- Rate limit específico nas tentativas de key.
- `REGISTRATION_KEY_SECRET` no `EnvService`.

## Fora do escopo
Telas do admin (o web já tem as Views), pedido de entrada no servidor (BE-10).

## Referências
- `plans/[complete]-core-product/00-requirements.md` 2.1 e 2.10
- `plans/PROGRESS.md`, suposições (validade 1/7/30 dias, sufixo de 3 caracteres)
- `plans/[complete]-backend/04-tech-plan.md` seções 1 e 2

## Checklist
- [x] Modelo e migration
- [x] Generator e hasher, com testes (alfabeto, tamanho, HMAC estável)
- [x] Use-cases com testes unitários in-memory (expirada, revogada, já usada, inexistente, uso concorrente)
- [x] Rotas de admin com DTOs do `packages/contracts` e OpenAPI
- [x] Hook `before` integrado. E2E: cadastro com key válida, inválida, expirada, revogada e repetida
- [x] Decidir e documentar o comportamento quando o sign-up falha depois do consumo
- [x] Commit a cada passo verde

## Critério de aceite
O admin gera uma key, ela aparece uma vez, a lista mostra só o sufixo, e o cadastro só passa com uma key válida, que não pode ser reutilizada.

## Notas da execução
- Módulo `src/modules/registration-invites`: `TokenGenerator`/`CryptoTokenGenerator` (`crypto.randomInt` sobre o alfabeto do `packages/contracts`), `TokenHasher`/`HmacTokenHasher` (HMAC-SHA256 com `REGISTRATION_KEY_SECRET`, mínimo 32 caracteres; trocar o segredo invalida as keys não usadas), repositório `prisma` e `in-memory`.
- Contrato em `packages/contracts/src/admin/registration-invite.ts`. A listagem devolve `suffix`, `status` (`active`, `used`, `revoked`, `expired`), datas em ISO e `usedBy` (`id`, `username`). A View do Storybook usa `hint` e status com união discriminada; o ViewModel faz o mapeamento.
- Rotas (`@PlatformAdmin()`): `POST /api/admin/registration-invites` (201, devolve a key inteira uma única vez), `GET /api/admin/registration-invites` (mais nova primeiro, sem limpeza) e `POST /api/admin/registration-invites/:id/revoke` (204; revogar de novo não dá erro; key usada responde 409 `REGISTRATION_INVITE_USED`; inexistente, 404).
- **Comportamento quando o sign-up falha depois do consumo (decidido):** reserva e acerto.
  - O hook `before` do sign-up (`ConsumeRegistrationInvite`) marca a key como usada (`usedAt`) num único `UPDATE` condicional (não usada, não revogada, não vencida). De dois cadastros simultâneos com a mesma key, só um passa.
  - O hook `after` (`SettleRegistrationInvite`) grava `usedById` quando a conta foi criada, ou devolve a key (`usedAt = null`) quando o Better Auth recusou o cadastro (email repetido, por exemplo). O Better Auth roda os hooks `after` também quando a rota responde erro.
  - Caso sem cobertura: se o processo cair entre os dois hooks, ou se o sign-up lançar um erro que não seja `APIError`, a key fica como usada sem dono. O admin gera outra. Aceito no MVP.
  - Descartado: transação do adaptador Prisma do Better Auth (vem desligada, e o consumo teria de usar o cliente da transação dele, fora do nosso repositório).
- Key inexistente, vencida, revogada ou usada respondem o mesmo erro (400 `INVALID_REGISTRATION_KEY`), para quem tenta não descobrir nada sobre a key.
- Rate limit das tentativas: o do próprio Better Auth em `/sign-up/email` (5 por minuto), configurado no BE-04. Não criei outro.
- Colisão de key (HMAC repetido) não tem retentativa: com ~10⁹ combinações e poucas keys, a chance é desprezível; se acontecer, a geração responde 500 e o admin tenta de novo.
- E2e: `test/factories/registration-invite.factory.ts` gera uma key real (com um admin criado direto no banco). O `signUp` dos testes de auth passou a usar essa factory.

