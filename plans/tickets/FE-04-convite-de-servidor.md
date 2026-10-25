# FE-04 · Entrar por link de servidor

> Pontos: 3 · Modelo sugerido: Sonnet · Depende de: FE-02 · Onda 3

## Contexto
A rota `/i/$code` funciona com e sem sessão e decide o caminho conforme o estado do convite e do usuário.

## Escopo
- `modules/invites`: `use-invite-landing` e Screen de `/i/$code`.
- Sem sessão: mostra o convite e leva ao SignUp (`?invite=`) ou ao SignIn (`?redirect=/i/$code`).
- Com sessão: confirmar entrada. Já membro abre o servidor; auto aprovação com vaga entra e abre; sem auto aprovação cria o pedido, volta ao Hub com toast.
- Expirado, usado, revogado ou servidor cheio: mensagem e volta ao Hub.

## Fora do escopo
Gerar e revogar convites (FE-07).

## Referências
- `plans/02-core-flows.md` F3
- `plans/tickets/BE-10-convites-e-membros.md`
- `modules/invites/views/invite-landing.view.tsx`

## Checklist
- [ ] ViewModel com `.spec.ts` cobrindo cada caminho
- [ ] Screen ligada
- [ ] Commit

## Critério de aceite
Os sete caminhos do F3 funcionam contra a API local.
