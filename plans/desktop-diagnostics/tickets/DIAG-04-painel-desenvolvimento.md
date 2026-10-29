# DIAG-04 · Painéis Desenvolvimento e MCP, documentação

> Status: em andamento. Depende de: DIAG-03. A ativação real do MCP depende do DIAG-05.

## Escopo

- Adicionar a aba **Desenvolvimento** ao painel administrativo existente.
- Mostrar na aba Desenvolvimento o estado separado de diagnóstico, CDP, inspector do `main` e DevTools.
- Adicionar uma aba administrativa separada chamada **MCP**.
- Mostrar na aba MCP o estado e a configuração do servidor MCP local.
- Mostrar todos os recursos como desligados quando o app não recebeu os argumentos correspondentes.
- Mostrar portas locais e limitações quando um recurso estiver ativo.
- Explicar que o painel não abre portas nem ativa CDP remotamente. A ativação inicial ocorre pelos argumentos do processo.
- Iniciar e encerrar o servidor MCP local com confirmação explícita dentro da aba MCP.
- Exibir endereço local, porta, token temporário e comando ou configuração de conexão para a ferramenta externa enquanto o MCP estiver ativo.
- Mostrar o MCP como desligado por padrão e revogado ao fechar o desktop.
- Criar uma documentação MDX única, versionada com o client e renderizada nessa aba.
- Documentar os comandos de inicialização, portas, escopo dos dados, riscos, como consultar o CDP e como desligar os recursos.
- Manter a View sem acesso a Electron, bridge, router ou regras de negócio. O Screen deve apenas ligar o ViewModel à View.

## Fora do escopo

- Ativar CDP ou MCP por comando enviado pelo servidor self-hosted.
- Expor portas na internet.
- Implementar o servidor MCP.
- Alterar a política de logs de produção, que pertence ao DIAG-01.

## Checklist

- [x] Aba Desenvolvimento disponível para administradores
- [x] Aba MCP disponível para administradores
- [x] Estados desligado, ativo e indisponível definidos no Model
- [x] Portas e argumentos exibidos com textos em inglês e português
- [ ] Ativação e encerramento do MCP local com confirmação na aba MCP, aguardando DIAG-05
- [x] Configuração temporária do MCP exibida somente durante a sessão ativa na View
- [x] Conteúdo MDX versionado como fonte única da documentação do Storybook
- [x] Story da View e testes do ViewModel adicionados
- [x] Navegação e permissões respeitam o painel administrativo existente
- [x] Notas da execução e suposições registradas

## Critério de aceite

Com o desktop iniciado sem argumentos, a aba Desenvolvimento mostra os recursos de inicialização desligados e ensina como iniciar o app em modo de diagnóstico. A aba MCP mostra o servidor indisponível até a implementação do DIAG-05. Nenhuma ação é executada pelo servidor remoto.

## Notas da execução

- A aba Desenvolvimento foi integrada ao painel administrativo com rotas próprias para `development` e `mcp`, mantendo o layout e a proteção existentes do painel.
- O estado de diagnóstico vem da porta `Platform.diagnostics`, sem importar Electron ou bridge nas Views e nos ViewModels.
- A documentação operacional foi adicionada em `packages/client/src/docs/admin-development.mdx`, cobrindo argumentos, portas, CDP, escopo local, riscos e encerramento.
- A aba MCP possui estados e a View de confirmação de encerramento, mas o ViewModel mantém o estado `unavailable` até a implementação do servidor no DIAG-05.
- *(suposição)* A documentação MDX fica disponível pelo Storybook como fonte versionada nesta etapa; a renderização contextual diretamente dentro da tela administrativa será concluída junto da integração final do MCP.
- *(suposição)* A permissão administrativa já aplicada pelo layout e pelas rotas existentes é suficiente para as novas abas, sem uma regra adicional de autorização no client.
