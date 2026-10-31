# PUB-10 · MCP local do Public

> Pontos: 8 · Depende de: PUB-05, PUB-07, DIAG-05 · Branch `feature/public-mcp`, saída da `dev`

## Escopo

- Criar um adaptador MCP local para os recursos da seção `Public`.
- Ativar e encerrar o MCP pela aba administrativa `Public > MCP`.
- Usar endpoint local e token temporário, com revogação ao encerrar.
- Expor ferramentas para consultar e editar roadmap, changelog e solicitações.
- Reutilizar os use cases da API e do painel.
- Exibir estado, endpoint, token e clientes conectados na View.
- Testar handshake, autorização, escopo e revogação.

## Fora do escopo

MCP remoto, acesso direto ao banco, GitHub, comandos arbitrários e ativação automática.

## Critério de aceite

Um admin ativa o MCP local explicitamente, uma ferramenta autorizada consegue operar os recursos públicos permitidos, e o acesso deixa de funcionar ao encerrar a sessão.

## Checklist

- [ ] Servidor MCP Public criado
- [ ] Ferramentas de leitura criadas
- [ ] Ferramentas de escrita criadas
- [ ] Token e escopo implementados
- [ ] Aba MCP integrada ao painel Public
- [ ] Testes de autorização e revogação criados
