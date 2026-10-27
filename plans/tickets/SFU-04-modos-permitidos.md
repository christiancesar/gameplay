# SFU-04 · Modos de transmissão permitidos: na plataforma e por servidor

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: SFU-01 · Onda 2

## Contexto
O admin da plataforma quer bloquear de forma global quais modos de transmissão existem, e cada servidor também pode restringir os seus (decisão do usuário em 2026-10-27). Os modos são **Servidor (SFU)** e **Direto (Mesh)**. Segue o padrão do módulo `limits`: configuração global com override por servidor.

## Escopo
- Configuração global nos `platform-settings` do `limits`: quais modos estão liberados. Padrão: os dois. A plataforma não aceita desligar os dois.
- Override por servidor: owner e admin do servidor escolhem um subconjunto do que a plataforma libera. Não aceita ficar vazio.
- Modos efetivos = o que a plataforma libera ∩ o que o servidor escolheu. Se a interseção ficar vazia (a plataforma desligou o único modo que o servidor tinha), vale o que a plataforma libera *(suposição)*.
- Rota para o web saber, num servidor, os modos efetivos e a disponibilidade de cada um: modo permitido, disponível ou não, e o motivo (`not-configured`, `budget-exhausted`, `unavailable`, vindos do SFU-01 e SFU-03).
- A API recusa no `stream:start` um modo que não é efetivo no servidor, e também as rotas de publicação no SFU.
- Mudar a configuração não derruba lives no ar. Elas continuam até o fim *(suposição)*. Mudanças avisam os clientes do servidor pelo socket (`server:changed` ou equivalente), para o diálogo se atualizar.
- Se o servidor só permite SFU e o SFU está indisponível, ninguém transmite nesse servidor até o SFU voltar ou a configuração mudar (decisão do usuário em 2026-10-27).
- Web:
  - painel do admin da plataforma: os dois modos, com a mesma explicação do diálogo de compartilhar;
  - configurações do servidor (FE-07): os modos que a plataforma libera, para owner e admin do servidor.
- i18n em `en` e `pt`, stories e testes.

## Fora do escopo
Diálogo de compartilhar e transporte (SFU-02). Orçamento (SFU-03). Escolha automática do modo pelo número de espectadores (trabalho futuro).

## Referências
- `plans/media-transport-options.md` seção 7
- `plans/tickets/BE-06-limites-e-configuracoes.md`, `BE-15-admin-da-plataforma.md`, `FE-07-modal-do-servidor.md`, `FE-11-admin.md`

## Checklist
- [ ] Migração do Prisma para a configuração global e o override por servidor
- [ ] Regra dos modos efetivos com testes (interseção, nunca vazio, queda para o global)
- [ ] Rota de modos efetivos com e2e
- [ ] `stream:start` e rotas do SFU recusando modo não permitido
- [ ] Aviso pelo socket ao mudar
- [ ] Painel do admin e configurações do servidor, com stories
- [ ] i18n e testes
- [ ] Commit

## Critério de aceite
Desligando o SFU no painel da plataforma, nenhum servidor oferece mais "Servidor (SFU)". Um servidor que escolhe só "Direto (Mesh)" não oferece o SFU, mesmo com a plataforma liberando. Uma tentativa de transmitir num modo bloqueado é recusada pela API.
