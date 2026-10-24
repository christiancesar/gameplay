# BE-06 · Limites e configurações da plataforma

> Pontos: 3 · Modelo sugerido: Haiku ou Sonnet · Depende de: BE-04 · Onda 5

## Contexto
Os limites têm padrão global editável pelo admin sem redeploy, com override por usuário ou por servidor:
- servidores criados por usuário: 1;
- membros por servidor: 10;
- salas por servidor: 2.

O limite efetivo é o override, quando existe, senão o padrão. A versão mínima do Chromium (exemplo: 130) também fica aqui.

## Escopo
- Modelo `PlatformSettings` (linha única `global`), criada pela migration ou pelo seed.
- Os campos de override (`User.maxServersOverride`, `Server.maxMembersOverride`, `Server.maxRoomsOverride`) ficam nos modelos donos. Aqui só o resolvedor e as rotas de edição.
- Use-cases: `GetPlatformSettings`, `UpdatePlatformSettings`, `ResolveEffectiveLimit(kind, ownerId)`, `SetUserLimitOverride`, `SetServerLimitOverride`.
- Rotas de admin para ler e editar as configurações e os overrides.
- Rota pública (sem sessão) que devolve só `minChromiumVersion`, para o alerta de browser no SignIn.

## Fora do escopo
Aplicar os limites na criação de servidor, convite e sala (BE-09 e BE-10 chamam o resolvedor).

## Referências
- `plans/00-requirements.md` 2.2, 2.10 e 2.13
- `plans/04-tech-plan.md` seção 2

## Checklist
- [ ] Modelo, migration e valores padrão
- [ ] Resolvedor com testes (com e sem override)
- [ ] Rotas de admin e a rota pública, com OpenAPI
- [ ] E2E: o admin altera um limite e o efetivo muda sem reiniciar
- [ ] Commit

## Critério de aceite
Os limites efetivos mudam pelo painel sem redeploy, e os overrides têm precedência sobre o padrão.
