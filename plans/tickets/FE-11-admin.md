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
- [x] ViewModel por aba com `.spec.ts`
- [x] Setup do 2FA com o admin do seed
- [x] Commit

## Critério de aceite
O admin configura o 2FA no primeiro acesso e todas as ações do F12 funcionam; usuário comum não entra em `/admin`.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com FE-04, FE-06, FE-08 e FE-11, na branch `feature/web-routing`. Revisado pelo Opus, que rodou a suíte inteira com os quatro juntos (web 694 testes, api 271) e um teste headless (Playwright) das telas principais contra a API local.

- Um ViewModel e uma Screen por rota: setup do 2FA (senha, QR com `qrcode`, código, códigos de recuperação), usuários, servidores, hardware, limites e keys. Query keys em `admin.keys.ts`, mappers com spec.
- Formatos conferidos por curl contra a API: o agente ligou o 2FA do admin do seed, leu as respostas e desligou de novo. O admin do seed continua sem 2FA.
- Sem 2FA, toda rota de admin responde 403 `TWO_FACTOR_REQUIRED`.
- No browser: `/admin` leva ao setup do 2FA, que renderiza.

Lacunas da API (contornadas no web, sem mudar o backend):
1. `AdminUser` não traz contagem de sessões, limite próprio nem servidores criados. O web faz uma chamada de sessões por usuário e conta os servidores pela lista de servidores (até 100).
2. **Não existe GET para os limites próprios de usuário e servidor**, só PUT. O painel guarda na memória o que salvou na sessão. **Depois de recarregar, um limite existente aparece como "padrão", e salvar o diálogo zera esse limite sem aviso.** Precisa de ajuste na API.
3. Não existe rota para encerrar uma sessão só: "Encerrar" encerra todas as sessões do usuário.
4. Sessão sem horário de última atividade: usa `createdAt` e "ativo agora" fica sempre falso.
5. Não existe listagem global de dispositivos: a aba de hardware lê os de cada usuário (até 100).

Suposições *(confirmar)*:
- Listas com até 100 itens, busca no servidor com 250 ms de espera, sem paginação (as Views não têm). *(suposição)*
- Redefinir senha encerra as sessões do usuário; a senha gerada tem 16 caracteres sem letras parecidas. *(suposição)*
- Erros das ações do admin aparecem em toast. *(suposição)*
- Presença no painel só atualiza ao recarregar a lista, sem socket. *(suposição)*
