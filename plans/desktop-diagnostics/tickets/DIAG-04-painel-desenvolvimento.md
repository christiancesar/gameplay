# DIAG-04 · Painéis Desenvolvimento e MCP, documentação

> Status: pendente. Depende de: DIAG-03.

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

- [ ] Aba Desenvolvimento disponível para administradores
- [ ] Aba MCP disponível para administradores
- [ ] Estados desligado, ativo e indisponível definidos no Model
- [ ] Portas e argumentos exibidos com textos em inglês e português
- [ ] Ativação e encerramento do MCP local com confirmação na aba MCP
- [ ] Configuração temporária do MCP exibida somente durante a sessão ativa
- [ ] Conteúdo MDX renderizado a partir de uma única fonte
- [ ] Story da View e testes do ViewModel adicionados
- [ ] Navegação e permissões respeitam o painel administrativo existente
- [ ] Notas da execução e suposições registradas

## Critério de aceite

Com o desktop iniciado sem argumentos, a aba Desenvolvimento mostra os recursos de inicialização desligados e ensina como iniciar o app em modo de diagnóstico. A aba MCP mostra o servidor desligado. O MCP só fica ativo após confirmação nessa aba, mostrando a configuração local temporária. Nenhuma ação é executada pelo servidor remoto.
