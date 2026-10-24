# BE-03 · Erros, validação com zod, OpenAPI/Scalar, AsyncAPI e barramento de eventos

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: BE-02 · Onda 3

## Contexto
Todo DTO nasce de um schema zod do `packages/shared` (`nestjs-zod`). O REST é documentado com OpenAPI no Scalar, e os eventos do socket com AsyncAPI (`nestjs-asyncapi`). Os use-cases publicam eventos de domínio num barramento interno, para os módulos REST não dependerem do gateway.

## Escopo
- `common/errors`: `DomainError` (código, mensagem, status) e um filtro global que converte para `{ error: { code, message } }`. Um helper equivalente para ack de socket.
- `nestjs-zod`: `ZodValidationPipe` global e serializer. Um DTO de exemplo via `createZodDto` a partir de um schema do `packages/shared`.
- `@nestjs/swagger` 11 + Scalar (`@scalar/nestjs-api-reference`) em `/api/docs`, com o documento em `/api/docs/openapi.json`.
- `nestjs-asyncapi` com servidor `socket.io`, documento em `/api/docs/events`. Testar se o Scalar renderiza AsyncAPI; se não renderizar, usar o visualizador do próprio `nestjs-asyncapi`.
- `@nestjs/event-emitter` configurado e o tipo `DomainEvents` em `src/common/events` (lista em `04-tech-plan.md` seção 3), com um helper tipado para publicar e assinar.
- `@nestjs/throttler` global com limites padrão. Os limites específicos de login e cadastro ficam para o BE-04 e o BE-05.
- `packages/shared`: estrutura `src/http/` (schemas de DTO) e `src/realtime/` (eventos). Organizar o `usernameSchema` do BE-01 em `src/http/` ou manter em `src/account/`, conforme a estrutura escolhida.

## Fora do escopo
Endpoints de domínio, gateway real (BE-11).

## Referências
- `plans/04-tech-plan.md` seções 1 e 3
- `plans/00-requirements.md` 3.3.1

## Checklist
- [ ] Consultar docs atuais (Context7): `nestjs-zod` com zod 4, `@scalar/nestjs-api-reference`, `nestjs-asyncapi`
- [ ] `DomainError` e filtro, com teste unitário
- [ ] Pipe zod global e DTO de exemplo, com teste e2e de erro de validação (400 com o formato padrão)
- [ ] OpenAPI e Scalar acessíveis em dev
- [ ] AsyncAPI gerado com um gateway de exemplo (removido ou mantido vazio no fim)
- [ ] Barramento de eventos tipado com teste unitário
- [ ] Throttler global
- [ ] Docs só em dev ou protegidas em produção *(decidir no ticket; sugestão: só em dev)*
- [ ] Commit a cada passo verde

## Critério de aceite
Um DTO definido no `packages/shared` valida a requisição, aparece no Scalar com o formato certo, e um erro de domínio volta no formato padrão.
