# 00 · Levantamento de Requisitos

> Registro das decisões tomadas na fase de levantamento (workflow ágil, fase 00).
> Data: 2026-10-22. Status: **acordado**, base para Epic Brief, Core Flows e Tech Plan.

## 1. Visão

App web de voz e compartilhamento de tela entre grupos fechados de pessoas, como alternativa ao Discord (que deixou de oferecer compartilhamento de tela de qualidade sem cobrança). A mídia usa o hardware dos próprios usuários (WebRTC P2P). O servidor guarda apenas metadados: usuários, servidores, salas, convites e configurações. Não há chat de texto.

## 2. Requisitos de produto

### 2.1 Cadastro e acesso
- Cadastro com **username, email, senha e convite (token)**. Sem validação de email.
- Convite de cadastro é gerado **somente pelo admin da plataforma** (ver 2.10).
- Convite é de **uso único**, tem **expiração gravada** e pode ser **revogado**. O admin vê quem usou cada convite.
- Key de cadastro com **6 caracteres alfanuméricos** (sem caracteres ambíguos como 0/O e 1/I, sem diferença de maiúsculas), digitada num input OTP. Gerada aleatoriamente, armazenada como **hash**, com rate limit nas tentativas.
- Login por **email ou username** + senha. Cadastro com confirmação de senha. Sem "esqueci minha senha": a redefinição é feita pelo admin da plataforma.
- Quem convida uma pessoa nova envia o **link do servidor** junto com uma **key de cadastro** (obtida com o admin da plataforma). Abrir o link sem conta leva ao cadastro; depois do cadastro o pedido de entrada no servidor é criado sozinho.
- Há **dois níveis de acesso independentes**: papéis **dentro de um servidor** (2.3) e o papel **de plataforma** (2.10). Ambos usam o mesmo app e o mesmo login.

### 2.2 Limites
Padrões globais, **editáveis pelo admin da plataforma** sem redeploy, com **override por usuário ou por servidor**:

| Limite | Padrão | Override |
|---|---|---|
| Servidores criados por usuário | 1 | por usuário |
| Membros por servidor (incluindo o owner) | 10 | por servidor |
| Salas por servidor | 2 | por servidor |

O limite efetivo é o override, quando existe, senão o padrão global.

### 2.3 Servidores e papéis
- Quem cria o servidor vira **owner**. Os demais entram como **member**.
- Papéis no servidor: `owner`, `admin`, `member`.

| Ação | owner | admin | member |
|---|---|---|---|
| Aprovar/recusar pedidos de entrada | sim | sim | não |
| Gerar e revogar convites do servidor | sim | sim | não |
| Kick de member | sim | sim | não |
| Kick de admin | sim | sim | não |
| Promover member a admin | sim | sim | não |
| Rebaixar admin a member | sim | sim | não |
| Criar, editar e excluir salas | sim | sim | não |
| Editar nome, ícone, cover, descrição e auto aprovação | sim | sim | não |
| Sair do servidor | **não** (só excluindo) | sim | sim |
| Kick ou rebaixar o owner | não se aplica | **não** | não |
| Excluir o servidor | sim | **não** | não |
| Transferir posse | não existe no MVP | | |
| Entrar nas salas, voz e tela | sim | sim | sim |

- O owner é intocável: ninguém no servidor pode rebaixá-lo ou removê-lo.

### 2.4 Convite de servidor
- Código de **8 caracteres** (o link carrega o mesmo código), de **uso único** e com **validade fixa de 1 hora**, sem configuração. Para convidar várias pessoas, gera-se um convite para cada uma. *(Revisado em 2026-10-23: antes era multiuso com máximo de usos e validade configuráveis.)*
- Owner e admin geram e revogam convites.
- O convite é **consumido quando o pedido de entrada é criado**. Quem abre o link sem conta e demora mais de 1 hora no cadastro tem a conta criada normalmente, e o Hub avisa que o convite expirou e que é preciso pedir outro *(decidido em 2026-10-24)*.
- Os convites ficam guardados como registro, sem limpeza. A lista mostra o status de cada um: ativo, vencido, usado ou revogado *(decidido em 2026-10-24)*.
- O convite registra **quem criou**, **quem usou** e **quando**. Owner/admin veem isso no servidor (convites e membros) e o admin da plataforma vê na lista de membros de cada servidor.
- Com o servidor no limite de membros, a **geração de convite fica bloqueada**.

### 2.5 Entrada e moderação
- Entrada pelo convite gera **pedido de entrada**, aprovado por owner ou admin.
- Toggle **"auto aprovação"** por servidor, **desligado por padrão**.
- Com o servidor no limite de membros, **aprovar pedidos de entrada fica bloqueado** (inclusive com auto aprovação ligada; o pedido fica pendente).
- Moderação no servidor: apenas **kick**, que libera a vaga. **Não existe ban no servidor.**

### 2.6 Salas
- Servidores contêm salas, até o limite (padrão 2). Apenas metadados persistidos.

### 2.7 Imagens
- **Avatar do usuário**, **ícone do servidor** e **cover do servidor**, todos **opcionais**. Sem avatar ou ícone, a interface mostra um fallback com iniciais.
- Cover processado em WebP 16:9 (1280x720). Onde o cover aparece na interface ainda está em aberto.
- Upload até **2 MB**, formatos **JPG, PNG e WebP**. Tipo validado pelo conteúdo real (magic bytes), não pela extensão.
- O Nest processa com `sharp`: recorte quadrado, **WebP 256px**, remoção de EXIF.
- O usuário troca ou remove o próprio avatar. Owner e admin trocam ou removem ícone e cover do servidor.

### 2.8 Voz
- Transmissão **contínua**. Sem push-to-talk no MVP.
- **Mute** (envio) e **deafen** (recepção) independentes, como no Discord.
- **Indicador de quem está falando** (Web Audio).
- **Volume por usuário** e **seleção de dispositivo** (microfone e saída).

### 2.9 Compartilhamento de tela
- Seleção de janela ou tela pelo seletor nativo do browser (`getDisplayMedia`).
- Presets: **720p30, 720p60, 1080p30, 1080p60**, escolhidos por quem compartilha.
- **Áudio da aba/sistema** quando o SO e o browser permitirem (aba em qualquer SO no Chromium; tela inteira com áudio só no Windows).
- **Várias telas simultâneas** na mesma sala.
- **Assistir sob demanda**: a tela só é enviada para quem clicar em assistir. Voz vai para todos.

### 2.10 Admin da plataforma
- Papel de plataforma **admin da plataforma** (`user.role = 'admin'` do Better Auth), separado dos papéis de servidor (`Membership.role`: owner, admin, member). **Mesmo app e mesmo login**, sem aplicação administrativa separada.
- Atribuído **somente por seed** (script/env). Não há promoção a admin da plataforma pela interface.
- **Login com verificação extra:** 2FA por **TOTP obrigatório** para o admin da plataforma, com códigos de recuperação. Rotas e telas administrativas exigem papel **e** sessão com 2FA verificado, checados no backend a cada requisição. Usuários comuns nunca acessam o painel.
- Painel administrativo:
  - Listar usuários, com status **online/offline** (presença do Socket.IO).
  - Ver **IP e user agent** das sessões (gravados pelo Better Auth; Nest confia no `X-Forwarded-For` do nginx/cloudflared).
  - Listar servidores, com owner, membros e salas.
  - Editar **limites globais** e **overrides** por usuário/servidor (2.2).
  - **Suspender e reativar conta**: bloqueia login e derruba sessões e conexões ativas.
  - **Encerrar sessões** de um usuário em todos os dispositivos.
  - **Excluir servidor** de qualquer usuário (remove salas, membros e convites; desconecta quem estiver nas salas).
  - Gerar, listar e revogar **convites de cadastro**.
  - **Redefinir senha** de um usuário.
- Observação: em WebRTC P2P os participantes de uma sala trocam IPs entre si pelo próprio protocolo (exceto quando a conexão passa por TURN).

### 2.11 Interface
- Sem dock e sem home pública. Entrada pelo SignIn; após login, sempre o **Hub**. Detalhes em `02-core-flows.md`.
- **Tema escuro (padrão) e claro**, alternável e lembrado por usuário.
- **Idiomas inglês e português**, detectados pelo browser, com seletor no SignIn, SignUp, Hub e Configurações.
- **Favicon** em rotação com ícones Lucide da categoria gaming.
- Marca: logos "Gameplay" e "Gameplay UNLIMITED" fornecidos pelo usuário.

### 2.12 Hardware dos dispositivos
- O app coleta o hardware de cada dispositivo para o admin da plataforma entender onde o Gameplay roda, qual o mínimo viável e quais recursos existem. *(Adicionado em 2026-10-23.)*
- Coletado no Chrome, sem pedir permissão: SO, versão, arquitetura e bits (User-Agent Client Hints), versão do browser, núcleos lógicos (`hardwareConcurrency`), RAM aproximada (`deviceMemory`, arredondada e com teto), GPU e se a aceleração gráfica está ligada (WebGL/WebGPU), codificação de vídeo por hardware para H.264, VP9 e AV1 a 1080p60 (Media Capabilities), rede (Network Information).
- Com permissão: todos os monitores com resolução, escala e taxa de atualização (Window Management API). A permissão é pedida num aviso no Hub e também na seção Hardware das Configurações.
- **Não disponível no browser:** modelo do processador, RAM exata, memória da GPU, disco e placa-mãe. Isso exigiria um app desktop.
- O usuário pode **complementar manualmente** o que o browser não expõe: modelo do processador, RAM, placa de vídeo, VRAM, tipo de conexão e plano de internet (download/upload). Esses campos aparecem marcados como "informado pelo usuário".
- Enviado ao servidor no login e quando o usuário pede "Coletar de novo"; um registro por dispositivo.
- O usuário vê o que foi coletado em Configurações > Hardware. O admin vê por usuário e numa aba com o resumo da base (menos núcleos, menos memória, % com aceleração, % com H.264 por hardware).

### 2.12.1 Notificações no Hub
- Painel de notificações no Hub: à direita em telas grandes, separado do conteúdo por um divisor vertical e centralizado junto com ele; abaixo de "Entrar em um servidor" em telas pequenas. *(Adicionado em 2026-10-23.)*
- Reúne alertas (browser, VPN, aceleração gráfica desligada, permissão de monitores) e avisos (pedido enviado/aprovado, removido, servidor excluído, promovido/rebaixado).
- O usuário dispensa cada uma ou limpa tudo.

### 2.13 Browsers
- Alvo do MVP: **Chromium (Chrome/Edge)**. Firefox e Safari sem garantia.
- O app detecta o browser (User-Agent Client Hints, com fallback no user agent) e mostra um alerta no SignIn e no Hub *(adicionado em 2026-10-23)*:
  - **Não Chromium:** recomenda Chrome, Edge, Brave, Opera ou Vivaldi, com links de download.
  - **Chromium abaixo da versão mínima:** mostra a versão atual e a mínima e como atualizar.
  - Dispensável com "Continuar mesmo assim" (não bloqueia o uso).
- **VPN/proxy:** detecção por heurística (sem garantia), só para avisar: IP público visto pelo STUN diferente do IP da requisição HTTP (proxy/VPN de navegador). *(Revisado em 2026-10-24: a checagem de faixa de datacenter/VPN e de fuso contra a região do IP saiu do MVP, porque exige bases externas de IP e geolocalização.)*

## 3. Arquitetura

### 3.1 Topologia de mídia
- **WebRTC mesh P2P**. O limite prático vem do upload e da CPU de quem compartilha (cada espectador recebe um stream codificado separadamente). Voz aguenta a sala cheia (10). Tela é mitigada pelo "assistir sob demanda".
- Camada de mídia abstraída na interface `MediaTransport` (implementação `MeshTransport`) para permitir troca futura por SFU (LiveKit ou Cloudflare Realtime SFU).
- **ICE** escolhido por env, sem mudança de código: `ICE_PROVIDER=cloudflare | coturn | stun-only`.
  - Fase local: STUN + TURN do **Cloudflare Realtime** (1.000 GB/mês grátis; STUN grátis e ilimitado), com credenciais efêmeras emitidas pela API.
  - Fase EC2: **coturn** em container no IP público.

### 3.1.1 Qualidade e latência da mídia
Discutido em 2026-10-24. O servidor (Socket.IO) só faz a sinalização (SDP, candidatos ICE, presença) e não fica no caminho da mídia. O TURN só repassa pacotes. A qualidade se decide nas pontas, e o gargalo real é o upload de quem transmite (em mesh, um stream codificado por espectador). Quando a rede não aguenta, o WebRTC baixa resolução ou fps, nunca soma delay.

Quem transmite:
- **Codec** escolhido pelo hardware coletado (Media Capabilities, `powerEfficient`): AV1 por hardware se houver, senão H.264 por hardware, senão VP9. Aplicado com `setCodecPreferences`.
- `track.contentHint = 'motion'` e `degradationPreference: 'maintain-framerate'` como padrão para jogo: a resolução cai antes do fps.
- `maxBitrate` e `maxFramerate` por preset via `RTCRtpSender.setParameters`, com teto coerente com o upload medido.
- Voz com `priority: 'high'`: quando a banda aperta, cai a imagem, não a voz.

Áudio (o WebRTC já cuida de: Opus com bitrate adaptativo, FEC e DTX, cancelamento de eco, supressão de ruído, ganho automático, jitter buffer e ocultação de perda, e sincronia com o vídeo do mesmo stream). O app cuida de:
- Voz: `echoCancellation`, `noiseSuppression` e `autoGainControl` ligados no `getUserMedia`.
- Áudio do jogo (compartilhamento): os três desligados, porque estragam música e efeitos. Opus em estéreo e bitrate maior (`stereo=1` e `maxaveragebitrate` no SDP, por exemplo 128 kbps), já que o padrão do WebRTC é afinado para voz.
- **Eco da chamada no áudio do sistema**: no Windows, capturar a tela inteira com áudio inclui o som da própria chamada, e os outros ouvem a si mesmos. Mitigar com a constraint de excluir o áudio da própria página (`restrictOwnAudio`, em versões recentes do Chromium; verificar suporte) e preferir compartilhar a janela ou aba do jogo.
- Dispositivos (`enumerateDevices`, `setSinkId`), volume por pessoa (Web Audio `GainNode`), mute (`track.enabled = false`), deafen (silencia o áudio recebido e o microfone) e indicador de quem fala (`AnalyserNode`).

Rede:
- Caminho direto em UDP é o caso ideal. TURN sobre TCP/TLS só como último recurso (head-of-line blocking).
- Perda de pacote recuperada sem esperar: FEC (Opus inband FEC e RED na voz) e NACK (custa um RTT só no pacote perdido).
- **Região do TURN**: o relay tem que ficar perto dos usuários. Cloudflare Realtime é anycast e atende pelo PoP mais próximo (São Paulo). O coturn da Fase 2 deve ficar em **sa-east-1**, mesmo que o resto da infraestrutura fique em outra região (relay em us-east-1 soma cerca de 120 ms de ida e volta para usuários no Brasil).
- Conexão mais rápida: trickle ICE e credenciais TURN emitidas antes de entrar na sala.

Quem assiste:
- `RTCRtpReceiver.jitterBufferTarget` baixo por padrão: menos delay, com algum risco de engasgo em rede instável.

Medição:
- `getStats()` alimenta o monitor "Ao vivo" (F8): `qualityLimitationReason` (`bandwidth` ou `cpu`), `roundTripTime`, `jitterBufferDelay`, `packetsLost`, `framesDropped`.

Mesh e SFU como opções para o usuário, com custo zero como padrão: documentado em `media-transport-options.md`. **MVP só mesh**; SFU na fase seguinte.

Próximo passo se o upload virar o limite: trocar `MeshTransport` por SFU com simulcast ou SVC (`scalabilityMode`), para quem transmite enviar um encoding só e cada espectador receber a camada que a rede dele suporta. SFU só repassa pacotes; nunca transcodificar no servidor, porque isso soma delay.

Electron (avaliado, fora do MVP): usa a mesma pilha WebRTC do Chromium, então não melhora a qualidade da imagem nem elimina sinalização e TURN. Ganhos: áudio do sistema uniforme entre SOs, captura sem o seletor do browser, push-to-talk global. Entraria como casca do mesmo app React. Pipeline nativo (estilo Parsec/Sunshine) seria outro escopo.

### 3.2 Monorepo
- **npm workspaces + Turborepo**.

```
gameplay/
├── apps/
│   ├── web/                      # React + Vite
│   └── api/                      # NestJS (REST + Socket.IO)
├── packages/
│   └── shared/                   # schemas zod, DTOs, eventos Socket.IO tipados
├── infra/
│   ├── nginx/default.conf
│   ├── docker-compose.dev.yml    # nginx, web, api, postgres, cloudflared
│   └── docker-compose.prod.yml   # nginx, web, api, coturn
├── plans/
├── turbo.json
└── package.json
```

### 3.3 Backend (`apps/api`)
- **NestJS 11** *(revisado em 2026-10-24: o Nest 12 ainda não é aceito pelo `nestjs-asyncapi` nem pelo `nestjs-zod`; migrar quando o ecossistema alcançar)*. REST e **Socket.IO Gateway** (`@nestjs/websockets`) no mesmo processo, para sinalização WebRTC e presença.
- **PostgreSQL + Prisma 7** *(revisado em 2026-10-24: antes MongoDB + Prisma 6. O Prisma 6 só recebe patches de segurança até 19/11/2026, o Prisma 7 não tem conector Mongo e o Prisma 8 com Mongo ainda é RC. Os dados são relacionais)*. Driver adapter `@prisma/adapter-pg`, `prisma.config.ts`, schema dividido em vários arquivos (`prisma/schema/*.prisma`), migrations versionadas.
- **Better Auth** com `prismaAdapter` (provider `postgresql`) e integração `@thallesp/nestjs-better-auth`. Plugins: `username` (login por email ou username), `admin` (papel de plataforma, suspensão, listagem de usuários e sessões) e `twoFactor` (TOTP obrigatório para o admin da plataforma). Exige `bodyParser: false` no `main.ts`. O convite de cadastro é validado e consumido em hook `before` do sign-up.
- Postgres local em container no `docker-compose.dev.yml`; na Fase 2, **Neon free** *(suposição: Neon em vez de Supabase)*.
- DTOs e validação com **`nestjs-zod`** (`createZodDto` a partir dos schemas do `packages/contracts`), que alimenta o OpenAPI e o AsyncAPI.
- SOLID leve: cada use-case é um `@Injectable` com um único `execute()` (SRP). Repositório como `abstract class` usada como token de DI, com implementações `prisma` e `in-memory` (DIP). Testes unitários usam `in-memory`.
- **Storage de imagens:** upload multipart para o Nest. `StorageProvider` (abstract class) com `LocalStorageProvider` e `S3StorageProvider`, ambos implementados desde o início e escolhidos por `STORAGE_DRIVER=local | s3`. Driver local grava em volume Docker servido pelo nginx (`/uploads`). Driver S3 serve por URL pública do bucket (ou CloudFront). O banco guarda só a chave/URL da imagem.

```
apps/api/
├── prisma/
│   └── schema/
│       ├── schema.prisma               # generator + datasource
│       ├── auth.prisma                 # User, Session, Account, Verification, TwoFactor (Better Auth)
│       ├── registration-invite.prisma
│       ├── platform-settings.prisma    # limites globais, versão mínima do Chromium
│       ├── server.prisma               # Server, ServerMember, JoinRequest
│       ├── server-invite.prisma
│       ├── room.prisma
│       ├── notification.prisma
│       └── device-report.prisma        # hardware por dispositivo
├── src/
│   ├── @types/                         # augmentations (Request.user etc.)
│   ├── env/                            # schema zod + EnvService
│   ├── generated/                      # prisma client (gitignored)
│   ├── lib/
│   │   ├── auth.ts                     # instância Better Auth + hook do convite
│   │   ├── prisma.ts                   # PrismaService
│   │   ├── logger.ts                   # pino
│   │   ├── otel.ts                     # OpenTelemetry
│   │   └── openapi-document.ts         # Swagger
│   ├── common/                         # guards, @CurrentUser, filters, ZodPipe, DomainError base
│   ├── modules/
│   │   ├── registration-invites/
│   │   │   ├── registration-invites.module.ts
│   │   │   ├── controllers/
│   │   │   ├── dtos/
│   │   │   ├── entities/
│   │   │   ├── errors/
│   │   │   ├── providers/              # TokenGenerator, TokenHasher (interface + impl)
│   │   │   ├── repositories/
│   │   │   │   ├── registration-invites-repository.ts   # abstract class (token de DI)
│   │   │   │   ├── in-memory/
│   │   │   │   └── prisma/
│   │   │   └── use-cases/              # *.use-case.ts + *.use-case.spec.ts
│   │   ├── accounts/                   # perfil, avatar, seed do admin da plataforma
│   │   ├── platform-admin/             # painel: usuários, IP, sessões, suspender, excluir servidor
│   │   ├── limits/                     # padrões globais + overrides, resolução do limite efetivo
│   │   ├── servers/                    # criar (limite), ícone, auto aprovação, papéis
│   │   ├── server-invites/             # uso único, 1 hora, bloqueio no limite de membros
│   │   ├── memberships/                # pedidos de entrada, aprovar, kick, promover/rebaixar
│   │   ├── rooms/
│   │   ├── realtime/                   # gateway Socket.IO: presença + sinalização
│   │   │   ├── gateways/
│   │   │   ├── events/
│   │   │   └── use-cases/
│   │   ├── ice/                        # credenciais TURN efêmeras por provider
│   │   └── storage/                    # upload e processamento de imagem
│   │       ├── providers/
│   │       │   ├── storage-provider.ts         # abstract class (token de DI)
│   │       │   ├── local-storage.provider.ts
│   │       │   ├── s3-storage.provider.ts
│   │       │   └── in-memory-storage.provider.ts
│   │       ├── image-processor.ts      # sharp: validação, WebP 256px, sem EXIF
│   │       └── use-cases/
│   ├── app.module.ts
│   └── main.ts
└── test/
    ├── e2e/                            # supertest + postgres docker
    └── factories/
```

### 3.3.1 Contrato REST e Socket.IO (decidido em 2026-10-24)
- **REST** para o que o cliente pede e espera resposta, principalmente o que grava no banco (auth, conta, servidores, convites, membros, salas, admin, hardware, notificações, credenciais TURN). **Socket.IO** para o que o servidor precisa avisar sem ser perguntado e para o estado efêmero da conexão (presença, entrar/sair da sala de voz, sinalização WebRTC, mute/deafen, início/fim de transmissão, "assistir").
- Padrão combinado: a ação que muda o banco vai por REST; depois de gravar, o servidor emite o evento para os interessados (kick, aprovação de entrada, suspensão). No frontend, o evento só invalida a query do TanStack Query ou atualiza a store; o REST continua a fonte dos dados.
- **Tipagem compartilhada em `packages/contracts`** (decisão do usuário): schemas zod de DTOs e payloads, interfaces `ClientToServerEvents` e `ServerToClientEvents` usadas como genéricos do Socket.IO nos dois lados (`Server<...>` na API, `Socket<...>` no web), e constantes com os nomes dos eventos para o `@SubscribeMessage`. Erro de nome ou de payload vira erro de compilação na API e no web.
- O gateway valida todo payload recebido com o schema zod (`ZodPipe`), porque os tipos não existem em runtime.
- Nome dos eventos no formato `dominio:acao` (`room:join`, `signal:send`, `presence:update`). A direção fica no tipo, não no nome. Pedido e resposta pelo socket usam ack (callback como último argumento).
- **Documentação** (decisão do usuário: os eventos também são documentados):
  - REST: OpenAPI gerado pelo Nest, exibido no **Scalar**.
  - Socket.IO: **AsyncAPI**, gerado a partir dos mesmos schemas do `packages/contracts`. Ferramenta: **`nestjs-asyncapi`** *(decidido em 2026-10-24)*, com decorators nos gateways e payloads vindos dos DTOs do `nestjs-zod`; exige `@nestjs/swagger` 11. Exibição no Scalar se a integração JS já aceitar AsyncAPI (o suporte do Scalar é experimental); senão, no visualizador do AsyncAPI.

### 3.4 Frontend (`apps/web`): MVVM
- **React + Vite + TanStack Router** (rotas por arquivo, `beforeLoad` para auth, `loader` integrado ao TanStack Query).
- **TanStack Query, Axios, Zustand, Tailwind, shadcn/ui.**
- **Formulários: React Hook Form + Zod** (`@hookform/resolvers/zod`), com os campos montados no `Field` do shadcn.
- Build estático servido pelo nginx.
- **Estado na URL:** search params pelo `validateSearch` do TanStack Router com schema Zod (sem nuqs). Etapas de um mesmo fluxo ficam na mesma rota, controladas por query param, para o voltar do navegador e o refresh funcionarem *(decidido em 2026-10-24)*.
- **Lint e formatação:** `oxlint` (com `react/no-multi-comp`) e `oxfmt` (sem ponto e vírgula, aspas simples, 120 colunas) *(decidido em 2026-10-24)*.
- **Um componente por arquivo** em todo código nosso. Ficam de fora `shared/ui` (componentes compostos do shadcn, atualizados pelo CLI) e `*.stories.tsx` *(decidido em 2026-10-24)*.

**MVVM é a arquitetura do frontend inteiro**, com View separada de lógica de negócio:

| Camada | Responsabilidade | Pode usar |
|---|---|---|
| **Model** | `entities/` (tipos de domínio), `rules/` (regras de negócio como funções puras), `*.schema.ts` (schemas Zod dos formulários; mensagens são chaves de i18n), `services/` (Axios, Socket.IO, `MediaTransport`), `mappers/` (DTO para entidade) | `packages/contracts` |
| **ViewModel** | Hook por tela/caso de uso. Orquestra TanStack Query (estado de servidor), Zustand (estado de cliente) e services/rules. Expõe estado pronto para exibir + comandos. Sem JSX. | Model |
| **View** | Componentes de apresentação. Só props e callbacks. Sem query, store, axios ou regra. Formulário: a View é dona do `useForm` (estado de digitação, campos tocados, erros na tela) com o schema do Model, e só chama o ViewModel com dados já validados (`onSubmit(values)`). Erros que só o servidor conhece chegam por prop e entram no form via `useServerErrors`. | `shared/ui`, schemas do Model |
| **Screen** | Cola fina usada pela rota: chama o ViewModel e passa o resultado para a View. | ViewModel, View |

- Dependência em uma direção só, **garantida por lint** (`eslint-plugin-boundaries`) no CI. Única exceção: a View importa os schemas Zod (`model/*.schema.ts`).
- Schemas que o backend também valida (cadastro, nome de servidor, código de convite) migram para `packages/contracts` quando a API existir, e o NestJS usa os mesmos via `ZodPipe`.

```
apps/web/
├── .storybook/
├── cypress/
│   ├── e2e/
│   ├── support/
│   └── tasks/peer-bot.ts               # peer B headless via cy.task
└── src/
    ├── routes/                         # TanStack Router (file-based)
    ├── modules/
    │   ├── servers/
    │   │   ├── model/
    │   │   │   ├── entities/
    │   │   │   ├── rules/              # funções puras + .spec.ts
    │   │   │   ├── services/
    │   │   │   └── mappers/
    │   │   ├── view-models/
    │   │   │   ├── use-server-members.view-model.ts (+ .spec.ts)
    │   │   │   └── stores/             # zustand, só estado de cliente
    │   │   ├── views/
    │   │   │   ├── member-list.view.tsx
    │   │   │   └── member-list.view.stories.tsx
    │   │   └── screens/
    │   │       └── server-members.screen.tsx
    │   ├── auth/
    │   ├── admin/                      # convites de cadastro
    │   ├── rooms/
    │   ├── voice/                      # mute/deafen, volume, dispositivos, quem fala
    │   └── screen-share/               # presets, assistir sob demanda
    └── shared/
        ├── ui/                         # shadcn/ui
        ├── lib/                        # http.ts, query-client.ts, socket.ts, sentry.ts, monitoring.ts
        └── media/                      # MediaTransport + MeshTransport (WebRTC)
```

### 3.5 Storybook
- Story para **toda View** e todo componente de `shared/ui`, cobrindo todos os estados (loading, vazio, cheio, erro, bloqueado).
- **Interaction tests** (play functions) rodando no Vitest via addon, como parte do CI.

## 4. Ambientes e infraestrutura

- **nginx** na frente de tudo, mesmo domínio: `/` para web, `/api` para Nest, `/socket.io` para Nest com upgrade. Cookies do Better Auth sem CORS.
- **Storage:** fase local usa `STORAGE_DRIVER=local` (volume Docker). Fase EC2 usa `STORAGE_DRIVER=s3`. Os testes do driver S3 rodam contra **MinIO** em container.
- **Fase 1, local (máquina do desenvolvedor):** `docker-compose.dev.yml` com nginx, web, api, postgres e **cloudflared** (Cloudflare Tunnel) para os testers acessarem. O tunnel só carrega HTTP/WebSocket; a mídia vai direto entre os browsers. TURN via Cloudflare Realtime.
- **Fase 2, EC2 t3.medium:** `docker-compose.prod.yml` com nginx, web, api e coturn. Banco no **Neon free** (Postgres).
  - Pendente: a estimativa abaixo usa us-east-1, mas o coturn deve ficar em sa-east-1 (ver 3.1.1). Rever região e preços (sa-east-1 é mais cara, e a transferência de saída também).
- **Estimativa de custo da Fase 2 (ideação, us-east-1, sob demanda).** Valores a revisar com medição real depois que o app estiver rodando.

  | Item | Cálculo | US$/mês |
  |---|---|---|
  | t3.medium (referência) | 0,0416 × 730 h | 30,37 |
  | EBS gp3 30 GB | 30 × 0,08 | 2,40 |
  | IPv4 público | 0,005 × 730 h | 3,65 |
  | **Total base t3.medium** | | **~36,40** |

  - Variáveis: transferência de saída (100 GB/mês grátis, depois US$ 0,09/GB, pesa principalmente no relay do coturn), S3 (centavos), créditos de CPU da t3 em modo unlimited (configurar como standard).
  - t3.medium não entra no free tier. EBS e IPv4 podem ser cobertos se a conta for elegível; contas novas usam o modelo de créditos.
  - **Recomendação inicial: t4g.small** (ARM, 2 GB, ~US$ 12 de instância). Na EC2 rodam só nginx, Nest e coturn (frontend estático, Postgres no Neon, mídia P2P). Subir para t4g.medium se a medição pedir.
  - Segurança da instância: SSH restrito ao IP do admin (ou SSM Session Manager), EBS criptografado, portas do coturn abertas (3478 UDP/TCP, 5349 TCP e faixa UDP de relay).
- **Imagens de produção** são geradas só no CI, para a arquitetura do servidor (ARM64 se a EC2 for t4g). A imagem buildada na máquina do desenvolvedor (`npm run docker:api`) serve só para pegar erros de build e medir tamanho e memória; nunca vai para produção *(decidido em 2026-10-24)*.
- Deploy na Vercel **descartado**: a Vercel não mantém um processo Node persistente para o Socket.IO (WebSocket lá é experimental e preso a instância).

## 5. Observabilidade

- **Backend:** OpenTelemetry no Nest exportando para **Grafana Cloud free** (10k séries de métricas, 50 GB de logs, 50 GB de traces, retenção de 14 dias). Logs pino em JSON. Healthchecks no compose.
- **Frontend: Sentry** (`@sentry/react`), plano Developer grátis (o trial Business ativo volta sozinho para o Developer).
  - DSN em env (`VITE_SENTRY_DSN`); `environment` e `release` vindos de env/CI.
  - `tracesSampleRate` 1.0 em dev e 0.1 em prod.
  - Replay: `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 1.0`. Manter `maskAllText` e `blockAllMedia`.
  - `Sentry.tanstackRouterBrowserTracingIntegration(router)` para nomes de rota parametrizados.
  - `tracePropagationTargets` apontando para `/api` para ligar traces do browser aos do Nest.
  - Source maps via `@sentry/vite-plugin`, com `SENTRY_AUTH_TOKEN` como **segredo do CI** (arquivo local do wizard no `.gitignore`).
  - Inicialização em `shared/lib/sentry.ts`, `ErrorBoundary` no layout raiz. ViewModels reportam via wrapper `shared/lib/monitoring.ts`; Views nunca importam o Sentry.

## 6. Testes

- **Unitários (Vitest):** use-cases do Nest com repositórios e storage in-memory; rules, ViewModels (`renderHook`) e stores do frontend; Testing Library onde fizer sentido.
- **E2E da API:** supertest + Postgres em Docker.
- **E2E do app (Cypress):** usuário A dirigido pelo Cypress; usuário B é um **peer bot** headless (Chromium com mídia fake) controlado por `cy.task`, validando P2P real.
- **Storybook interaction tests** no CI.
- **Lint de fronteiras MVVM** no CI.

## 7. Planejamento e delegação

- Todos os artefatos em `plans/`.
- Estimativa em **story points (Fibonacci)** por ticket, com complexidade, dependências e **ondas paralelas**; totais por épico.
- Modelo sugerido por ticket:
  - **Opus:** planejamento, orquestração, revisão de arquitetura.
  - **Sonnet:** implementação de features.
  - **Haiku:** tarefas mecânicas e boilerplate.

## 8. Fora do escopo do MVP

- Chat de texto, push-to-talk, ban dentro do servidor, transferência de posse do servidor, promoção de admin da plataforma pela interface, SFU, suporte garantido a Firefox/Safari, validação de email, deploy na Vercel.

## 9. Próximas fases

1. `01-epic-brief.md`: Epic Brief.
2. `02-core-flows.md`: fluxos do usuário.
3. `03-prd-validate.md`: validação do PRD.
4. `04-tech-plan.md`: plano técnico.
5. Tickets com estimativa e delegação a agentes.
