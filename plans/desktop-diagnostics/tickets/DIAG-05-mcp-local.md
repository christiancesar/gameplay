# DIAG-05 · MCP local somente leitura

> Status: pendente. Depende de: DIAG-02 e DIAG-03.

## Escopo

- Implementar o adaptador MCP local sobre o coletor estruturado.
- Manter o servidor desligado por padrão e ativá-lo somente por ação explícita na aba **MCP** do painel administrativo local.
- Definir transporte local e autenticação adequada para processos na mesma máquina. A proposta inicial é HTTP em loopback, com porta dinâmica e token temporário.
- Permitir que o painel encerre o servidor e revogue imediatamente o token da sessão.
- Não aceitar ativação, configuração ou encerramento por comandos vindos do servidor self-hosted.
- Expor recursos estreitos para status do app, eventos recentes, tentativas de compartilhamento e estatísticas resumidas.
- Limitar o histórico, os campos e a retenção para não expor cookies, tokens, SDP, áudio, vídeo ou conteúdo de sessão.
- Documentar como uma aplicação externa local se conecta e como o usuário encerra o MCP.
- Exibir o estado do MCP, a porta, o token temporário e as instruções de conexão na aba MCP.

## Fora do escopo

- Transporte público, túnel ou endpoint acessível pela internet.
- Ativação automática por argumento, serviço do sistema ou inicialização do desktop.
- Execução arbitrária de JavaScript.
- Comandos que alterem o estado do app.
- Captura de conteúdo de abas, tela, áudio ou vídeo.
- Ativação remota pelo servidor.

## Checklist

- [ ] Transporte local escolhido e documentado
- [ ] Ativação somente pelo painel administrativo local
- [ ] Token temporário, expiração e revogação definidos
- [ ] Recursos e ferramentas somente de leitura definidos por esquema
- [ ] Autorização e desligamento implementados
- [ ] Limites de histórico e campos testados
- [ ] Cliente externo mínimo ou fixture de protocolo validado
- [ ] Aba MCP mostra o estado do servidor
- [ ] Build e inicialização sem MCP quando ele não for ativado pelo painel
- [ ] Notas da execução e suposições registradas

## Critério de aceite

Uma aplicação local autorizada consulta status e histórico resumido pelo MCP somente depois que um administrador inicia o servidor no painel. Ao encerrar a sessão ou o desktop, a porta deixa de responder e o token deixa de ser válido. Nenhuma consulta altera o app ou expõe dados de sessão.
