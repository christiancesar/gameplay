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

- [x] Servidor MCP Public criado
- [x] Ferramentas de leitura criadas
- [x] Ferramentas de escrita criadas
- [x] Token e escopo implementados
- [x] Aba MCP integrada ao painel Public
- [x] Testes de autorização e revogação criados

## Notas da execução

- O MCP local existente do desktop foi estendido com um escopo opcional para os recursos Public, mantendo transporte HTTP em loopback, token temporário e revogação ao encerrar.
- Foram adicionadas ferramentas para listar, criar e editar Roadmap e Changelog, além de listar e moderar feature requests.
- As ferramentas Public chamam os endpoints administrativos da API usando a sessão autenticada mantida pelo Electron, sem acesso direto ao Prisma ou ao banco.
- A aba `Public > MCP` passou a usar o controle funcional de MCP, mostrando estado, endpoint, token, configuração, ferramentas e clientes conectados.
- O servidor permanece desligado até uma ação explícita no painel, e a versão web continua sem capacidade de iniciar o servidor local.
- Foram adicionados testes de handshake, autorização, revogação, escopo condicional e chamada de ferramenta Public.
- _(suposição)_ O MCP Public é disponibilizado no host Desktop, que já possui a porta local e o armazenamento de cookies da sessão; no navegador, a aba informa o estado indisponível do host.
- _(suposição)_ As ferramentas de escrita recebem um objeto `input` validado pelos contratos compartilhados antes de chamar a API administrativa.
- _(suposição)_ A autorização administrativa continua sendo aplicada pela sessão e pelo guard da API, enquanto o token temporário autoriza apenas o processo MCP local durante a sessão ativa.

Validações executadas: `npm run repo:typecheck`, `npm run repo:lint`, `npm run repo:format-check`, `npm test -w desktop`, `npm run client:test` e `npm run web:build`.
