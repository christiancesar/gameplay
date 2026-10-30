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
- `plans/[complete]-core-product/02-core-flows.md` F11
- `plans/[complete]-backend/tickets/BE-08-contas.md`
- `packages/contracts/src/account/*`
- `modules/settings/views`, `modules/hardware`

## Checklist
- [x] ViewModels por seção com `.spec.ts`
- [x] Coleta de hardware como service do Model, testada com APIs do browser falsas
- [x] Commit

## Critério de aceite
Trocar avatar, username, senha, tema e idioma persiste depois do refresh; o hardware enviado aparece na seção.

## Notas da execução (2026-10-25)

Feito por um agente Sonnet, em paralelo com FE-04, FE-06, FE-08 e FE-11, na branch `feature/web-routing`. Revisado pelo Opus, que rodou a suíte inteira com os quatro juntos (web 694 testes, api 271) e um teste headless (Playwright) das telas principais contra a API local.

- Modal por `?settings=` renderizado no layout logado (`authed-layout.screen.tsx`); cada seção monta só o seu ViewModel.
- Perfil: avatar por upload ou remover, username pelo `updateUser` do Better Auth, senha com a atual pelo `changePassword`, email só leitura. Sessão recarregada depois de cada mudança.
- Áudio: dispositivos (`enumerateDevices`, `devicechange`) e teste do microfone com nível, atrás de serviços com fakes nos testes. Escolha salva na store de preferências de áudio.
- Aparência: tema e idioma aplicados na hora e gravados em `PATCH /me/preferences`; falha desfaz e mostra toast. O tema e o idioma da conta são aplicados uma vez ao entrar.
- Hardware: coleta (SO, browser, CPU, memória, GPU, WebGPU, codecs WebRTC, rede, monitores), envio automático ao entrar, coleta sob demanda, formulário manual e permissão dos monitores. Id do dispositivo no localStorage (`gameplay-device-id`).
- No browser: perfil e aparência abrem pela URL e renderizam.

Suposições *(confirmar)*:
- Tema e idioma da conta sobrescrevem a escolha local ao entrar; idioma `null` deixa o atual. *(suposição)*
- "Automático" no idioma grava `null` e usa o idioma do browser. *(suposição)*
- Trocar a senha não encerra as outras sessões. *(suposição)*
- Os monitores só são lidos quando a permissão já existe; o envio automático nunca pede permissão. *(suposição)*
- Comportamento real de Chromium e Firefox na coleta (WebGL, `getScreenDetails`, `encodingInfo`) não foi testado num browser de verdade. *(suposição)*
