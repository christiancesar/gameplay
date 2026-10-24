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
- Rotas de admin (`PlatformAdminGuard`): gerar, listar e revogar.
- Hook `before` do sign-up (`src/modules/auth/hooks/sign-up.hook.ts`, criado no BE-04, hoje só valida o formato) chamando o `ConsumeRegistrationInvite`. A key normalizada para maiúsculas. Se o sign-up falhar depois, a key não pode ficar queimada (transação, ou consumo no `after` com reserva; decidir no ticket).
- Rate limit específico nas tentativas de key.
- `REGISTRATION_KEY_SECRET` no `EnvService`.

## Fora do escopo
Telas do admin (o web já tem as Views), pedido de entrada no servidor (BE-10).

## Referências
- `plans/00-requirements.md` 2.1 e 2.10
- `plans/PROGRESS.md`, suposições (validade 1/7/30 dias, sufixo de 3 caracteres)
- `plans/04-tech-plan.md` seções 1 e 2

## Checklist
- [ ] Modelo e migration
- [ ] Generator e hasher, com testes (alfabeto, tamanho, HMAC estável)
- [ ] Use-cases com testes unitários in-memory (expirada, revogada, já usada, inexistente, uso concorrente)
- [ ] Rotas de admin com DTOs do `packages/shared` e OpenAPI
- [ ] Hook `before` integrado. E2E: cadastro com key válida, inválida, expirada, revogada e repetida
- [ ] Decidir e documentar o comportamento quando o sign-up falha depois do consumo
- [ ] Commit a cada passo verde

## Critério de aceite
O admin gera uma key, ela aparece uma vez, a lista mostra só o sufixo, e o cadastro só passa com uma key válida, que não pode ser reutilizada.
