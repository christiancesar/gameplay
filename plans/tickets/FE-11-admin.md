# FE-11 · Painel admin da plataforma

> Pontos: 8 · Modelo sugerido: Sonnet · Depende de: FE-02 · Onda 3

## Contexto
Rotas `/admin/*`, só para o admin da plataforma com 2FA ativo. Sem 2FA, o guard leva para `/admin/setup`.

## Escopo
- `/admin/setup`: QR do TOTP, confirmação do código e códigos de recuperação.
- `/admin/users`: lista com presença e sessões; suspender, reativar, encerrar sessões, redefinir senha, limite de servidores, hardware por dispositivo.
- `/admin/servers`: owner, membros (com convite e quem convidou), limites de membros e salas, excluir.
- `/admin/hardware`: resumo e tabela de dispositivos.
- `/admin/limits`: limites globais.
- `/admin/keys`: gerar com validade, copiar (mostrada uma vez), ver quem usou, revogar.

## Fora do escopo
Mudanças no backend.

## Referências
- `plans/02-core-flows.md` F12
- `plans/tickets/BE-04-auth-better-auth.md`, `BE-05-keys-de-cadastro.md`, `BE-06-limites-e-configuracoes.md`, `BE-15-admin-da-plataforma.md`
- `packages/contracts/src/admin/*`
- `modules/admin/views`

## Checklist
- [ ] ViewModel por aba com `.spec.ts`
- [ ] Setup do 2FA com o admin do seed
- [ ] Commit

## Critério de aceite
O admin configura o 2FA no primeiro acesso e todas as ações do F12 funcionam; usuário comum não entra em `/admin`.
