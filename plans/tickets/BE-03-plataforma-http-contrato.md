# BE-03 · Erros, validação com zod, OpenAPI/Scalar, AsyncAPI e barramento de eventos

> Pontos: 5 · Modelo sugerido: Sonnet · Depende de: BE-02 · Onda 3 · **Status: concluído em 2026-10-24**

## Contexto
Todo DTO nasce de um schema zod do `packages/contracts` (`nestjs-zod`). O REST é documentado com OpenAPI no Scalar, e os eventos do socket com AsyncAPI (`nestjs-asyncapi`). Os use-cases publicam eventos de domínio num barramento interno, para os módulos REST não dependerem do gateway.

## Escopo
- `common/errors`: `DomainError` (código, mensagem, status) e um filtro global que converte para `{ error: { code, message } }`. Um helper equivalente para ack de socket.
- `nestjs-zod`: `ZodValidationPipe` global e serializer. Um DTO de exemplo via `createZodDto` a partir de um schema do `packages/contracts`.
- `@nestjs/swagger` 11 + Scalar (`@scalar/nestjs-api-reference`) em `/api/docs`, com o documento em `/api/docs/openapi.json`.
- `nestjs-asyncapi` com servidor `socket.io`, documento em `/api/docs/events`. Testar se o Scalar renderiza AsyncAPI; se não renderizar, usar o visualizador do próprio `nestjs-asyncapi`.
- `@nestjs/event-emitter` configurado e o tipo `DomainEvents` em `src/common/events` (lista em `04-tech-plan.md` seção 3), com um helper tipado para publicar e assinar.
- `@nestjs/throttler` global com limites padrão. Os limites específicos de login e cadastro ficam para o BE-04 e o BE-05.
- `packages/contracts`: estrutura `src/http/` (schemas de DTO) e `src/realtime/` (eventos). Organizar o `usernameSchema` do BE-01 em `src/http/` ou manter em `src/account/`, conforme a estrutura escolhida.

## Fora do escopo
Endpoints de domínio, gateway real (BE-11).

## Referências
- `plans/04-tech-plan.md` seções 1 e 3
- `plans/00-requirements.md` 3.3.1

## Checklist
- [x] Consultar docs atuais (Context7): `nestjs-zod` com zod 4, `@scalar/nestjs-api-reference`, `nestjs-asyncapi`
- [x] `DomainError` e filtro, com teste unitário
- [x] Pipe zod global e DTO de exemplo, com teste e2e de erro de validação (400 com o formato padrão)
- [x] OpenAPI e Scalar acessíveis em dev
- [x] AsyncAPI gerado com um gateway de exemplo (removido ou mantido vazio no fim)
- [x] Barramento de eventos tipado com teste unitário
- [x] Throttler global
- [x] Docs só em dev ou protegidas em produção *(decidir no ticket; sugestão: só em dev)*
- [x] Commit a cada passo verde

## Critério de aceite
Um DTO definido no `packages/contracts` valida a requisição, aparece no Scalar com o formato certo, e um erro de domínio volta no formato padrão.

## Notas da execução
- Contrato de erro no `packages/contracts` (`errorResponseSchema`: `{ error: { code, message, fields? } }`) e tipos `Ack`/`AckResponse` para o socket. Uma única função (`resolveError`) mapeia qualquer exceção, usada pelo filtro HTTP e pelo `toAckError` do socket.
- `DomainError` tem status padrão 422; cada erro define `code` e pode trocar o status.
- `CommonModule` global: `ZodValidationPipe`, `ZodSerializerInterceptor`, filtro de erros, `ThrottlerGuard` (120 req/min por padrão) e `DomainEventBus`.
- Eventos de domínio: `DomainEvents` é uma interface vazia que cada módulo completa; `publish` aguarda os listeners (`emitAsync`), e `@OnDomainEvent` é o `@OnEvent` tipado.
- **Docs só fora de produção** (`DOCS_ENABLED` força ligar ou desligar). Scalar em `/api/docs`, com as duas fontes no seletor: REST (`/api/docs/openapi.json`) e Socket.IO (`/api/docs/asyncapi.json`).
- **`nestjs-asyncapi` e Scalar são devDependencies.** O `nestjs-asyncapi` traz o gerador de HTML do AsyncAPI (Puppeteer, TypeScript), que levava a imagem de produção de 413 MB para 1,02 GB. A doc é carregada por import dinâmico só quando ligada, e os gateways importam os decoradores de `src/docs/asyncapi-decorators.ts`, que vira no-op quando o pacote não está instalado. Imagem final: 448 MB.
- **`@nestjs/swagger` fixado em 11.4.2** (com `overrides` na raiz): a partir da 11.4.3 ele tem mapa de `exports`, e o `nestjs-asyncapi` 2.0.1 importa caminhos internos dele. Rever quando o `nestjs-asyncapi` for atualizado.
- Respostas usam `@ZodResponse` (gera o schema de saída e serializa). Não usar `.meta({ id })` no schema que vai direto no `createZodDto`: o `cleanupOpenApiDoc` acusa schema duplicado. O nome do schema na doc fica o da classe (`HealthReportDto_Output`).
- Health devolve o mesmo corpo com 503 quando o banco cai (não é um erro de API).
- Os exemplos (DTO, rota de erro, gateway documentado) ficam só nos e2e (`test/e2e/http-contract` e `test/e2e/docs`), sem código de exemplo em `src`.
- **Bug do BE-02 corrigido:** o `globalSetup` dos e2e roda fora dos workers e não recebe o `test.env`; as migrations iam para o banco de dev. Agora o url vem da config do projeto.
- Não verifiquei visualmente se o Scalar renderiza bem a fonte AsyncAPI (o suporte dele é recente); os dois JSON e a página respondem.
