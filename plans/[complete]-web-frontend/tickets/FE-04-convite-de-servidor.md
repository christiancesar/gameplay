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
- `plans/[complete]-core-product/02-core-flows.md` F3
- `plans/[complete]-backend/tickets/BE-10-convites-e-membros.md`
- `modules/invites/views/invite-landing.view.tsx`

## Checklist
- [x] ViewModel com `.spec.ts` cobrindo cada caminho
- [x] Screen ligada
- [x] Commit

## Critério de aceite
Os sete caminhos do F3 funcionam contra a API local.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com FE-04, FE-06, FE-08 e FE-11, na branch `feature/web-routing`. Revisado pelo Opus, que rodou a suíte inteira com os quatro juntos (web 694 testes, api 271) e um teste headless (Playwright) das telas principais contra a API local.

- `use-invite-landing` e `invite-landing.screen.tsx` em `/i/$code`. A rota só aquece a sessão, nunca redireciona.
- Sem sessão: convite com botões para `/sign-up?invite=CODE` e `/sign-in?redirect=/i/CODE`.
- Com sessão: confirma a entrada. Já membro, ou entrada aprovada na hora, abre o servidor; pedido pendente volta ao Hub com toast. Invalida a lista de servidores e as notificações.
- Erros (expirado, usado, revogado, desconhecido, pedido já pendente) mostram a mensagem e voltam ao Hub, ou ao login sem sessão. Mapper dos códigos reais da API com spec.
- Sign-up mostra o nome do servidor do convite; os links entre login e cadastro levam o convite junto.
- No browser: código inexistente mostra "Este convite não existe ou foi revogado" com "Voltar ao Hub".

Suposições *(confirmar)*:
- Convite revogado e falhas inesperadas aparecem como "não existe", porque a View não tem erro genérico. *(suposição)*
- Enquanto o convite carrega a tela fica vazia, em vez da `PendingScreen`. *(suposição)*
- Servidor cheio só aparece como aviso (`full` do `GET /invites/:code`) e não bloqueia o botão: a API não barra o limite de membros no `POST /invites/:code/join`, só na criação do convite e na aprovação. *(suposição; ver ponto aberto no PROGRESS)*
