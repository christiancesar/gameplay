# Ideias de funcionalidades

Ideias soltas, agrupadas por contexto. Nada aqui é ticket ainda.

## 1. Infraestrutura e credenciais por servidor

- [ ] Hoje o SFU, o TURN e qualquer outro recurso dependem das credenciais de quem roda o projeto: eu, como desenvolvedor, ou quem for subir a plataforma, preciso entrar em cada provedor e configurar as nossas credenciais.
  - O objetivo do projeto vai além de "clonar" o Discord. Manter algo no nível do Discord é caro.
  - A ideia é permitir que cada servidor faça a própria configuração e inclua as próprias credenciais. Assim o limite aumenta: o backend faz o trabalho pesado e entrega as interfaces prontas para cada servidor se autogerenciar dentro da plataforma. Meus recursos pessoais não são gastos e as pessoas conseguem usar a plataforma.
  - O principal desafio do projeto é ter uma transmissão ótima. O Discord faz isso muito bem com servidores e infraestrutura próprios, mas a um custo alto, que ele cobre vendendo o Nitro. Aqui eu não quero lidar com esse tipo de serviço, então posso transferir isso, de forma segura, para a responsabilidade dos próprios usuários.
  - Como a plataforma também pode rodar self-hosted, existe a opção de algo totalmente self-hosted para os usuários.
  - No painel administrativo ficam as configurações globais, que todos usam.
  - Dentro de cada servidor, os usuários podem usar as próprias credenciais.

## 2. Servidores

- [ ] Adicionar cover na criação do servidor.
- [ ] Os convites dos servidores são sempre privados, com código.
- [ ] Convites dentro do servidor com opção de validade. Hoje o padrão é 1h.
- [ ] Exclusão do servidor: permitir que o owner saia transferindo a propriedade para qualquer outro membro.

## 3. Membros e moderação

- [ ] Controle de membros: o administrador do servidor pode dar admin para outros membros. Eles não têm acesso ao painel administrativo da plataforma, só ao do servidor.
- [ ] Membros administradores podem:
  - [ ] Banir e aplicar shadow ban em membros. Nos dois casos é preciso informar o motivo, e fica registrado quem aplicou.
    - Banimento: o admin escolhe por quanto tempo, podendo ser para sempre. Só um admin pode revogar. Enquanto durar, o usuário não consegue entrar no servidor, nem com convite direto.
    - Shadow ban: o usuário continua no servidor, mas fica impossibilitado de usar todos os serviços por um tempo determinado (horas). Não faz sentido o usuário ficar no servidor banido para sempre.
  - [ ] Rebaixar membros.
  - [ ] Expulsar (kick) o usuário da sala.
  - [ ] Mutar na sala ou no servidor todo.
  - [ ] Auditoria de todas as ações: quem fez o que dentro do servidor.

## 4. Comunicação

- [ ] Chat, padrão como no Discord.
  - A retenção de dados é o ponto importante: não quero guardar as mensagens no banco de dados principal.
  - Ideia inicial: as mensagens ficam retidas enquanto as pessoas estão na room, com prazo de 15 minutos. Esse valor deve ser parametrizável e alterável globalmente.
  - Armazenamento pensado: Redis ou MongoDB guardando as conversas, e o banco principal guardando só referências para elas.
  - Conteúdo inicial só texto, para evitar a complexidade de imagens, vídeos, tipos de arquivo e limites.
- [ ] Notificações e avisos gerais.
- [ ] Adicionar e-mail.
- [ ] Webhooks de entrada: receber dentro do servidor informações de plataformas externas, como o Sentry. Algo customizável que sirva também para empresas.

## 5. Mídia e transmissão

- [ ] Assistir junto, no estilo do Rave (https://rave.io/pt/faq), dentro do servidor ou usando a mesma estrutura.
  - Exemplo: o usuário tem Netflix e quer assistir com os amigos. Ele entra na própria conta e transmite o que está assistindo. A ideia já existe e muda pouco em relação à infraestrutura que já teremos.
  - As pessoas se conectam, com chat junto, e assistem a série ao mesmo tempo.
  - Fora do escopo: controle compartilhado, compartilhamento de webcam e coisas parecidas.
  - Não guardar nenhuma informação do usuário nem do serviço de streaming.
- [ ] Configurações avançadas de áudio e de ruído.
- [ ] Quando o usuário sai do servidor e vai para o Hubm não mostra que ele está conectado. Preciso mostrar alguma coisa que quando o usuário sai da tela do servidor dele, tenha algum indicador.
- [ ] Integração com extensão de navegador para compartilhar uma aba específica do Brave, Chrome ou outro navegador compatível dentro do desktop.
  - A extensão deve usar a API de captura de abas do navegador e se comunicar com o desktop de forma segura.
  - Investigar o fluxo de autorização, instalação, atualização e compatibilidade entre navegadores.
  - Fora do escopo inicial: criar um navegador com abas dentro do desktop.
## 6. Bots

- [ ] Bots como no Discord, a explorar depois. Ideia inicial: um bot geral com acesso aos provedores de música dos próprios usuários ou a um provedor geral gratuito.

## 7. Modelo de negócio

- [ ] Pensar em como vender um serviço barato em larga escala. Nem todo mundo vai conseguir, ou querer, configurar servidor e credenciais por conta própria.
