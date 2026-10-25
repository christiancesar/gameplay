# FE-08 · Configurações do usuário e hardware

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: FE-02 · Onda 3

## Contexto
O modal abre por `?settings=<seção>` no layout logado (Hub e servidor).

## Escopo
- Perfil: avatar por upload ou remover, username e senha (com a senha atual) pelo Better Auth; email só leitura.
- Áudio: microfone e saída (`enumerateDevices`), teste de microfone com nível. Preferências na store de voz, persistidas localmente.
- Aparência: tema e idioma gravados na conta e aplicados na hora.
- Hardware: coleta do dispositivo (no login e sob demanda), formulário manual, permissão dos monitores, envio para a API.
- Sair da conta (reusa o `use-sign-out` do FE-02).

## Fora do escopo
Hardware visto pelo admin (FE-11).

## Referências
- `plans/02-core-flows.md` F11
- `plans/tickets/BE-08-contas.md`
- `packages/contracts/src/account/*`
- `modules/settings/views`, `modules/hardware`

## Checklist
- [ ] ViewModels por seção com `.spec.ts`
- [ ] Coleta de hardware como service do Model, testada com APIs do browser falsas
- [ ] Commit

## Critério de aceite
Trocar avatar, username, senha, tema e idioma persiste depois do refresh; o hardware enviado aparece na seção.
