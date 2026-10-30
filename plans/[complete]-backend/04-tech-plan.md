# 04 · Tech Plan do backend (`apps/api`)

> Criado em 2026-10-24. Base: `00-requirements.md` (seções 2, 3.1.1, 3.3 e 3.3.1), `02-core-flows.md` e `media-transport-options.md` (MVP só mesh).
> Decisões do usuário de 2026-10-24: NestJS 11, Postgres + Prisma 7, `nestjs-asyncapi`, tipagem em `packages/contracts`, VPN só pelo check do STUN, convite consumido na criação do pedido.
> Itens marcados **(suposição)** são propostas minhas, a confirmar na revisão.
> Os tickets de implementação ficam em `plans/[complete]-backend/tickets/`, um por arquivo.

## 1. Abordagem arquitetural

**Processo único.** Um processo NestJS 11 com **Express 5** *(decidido em 2026-10-24: o adaptador do Better Auth só tem suporte beta a Fastify, e a carga da API é baixa)* serve REST (`/api`) e Socket.IO (`/socket.io`) atrás do nginx, no mesmo domínio do web. Instância única no MVP: presença e estado das salas ficam na memória do processo, sem Redis *(decidido em 2026-10-24: Redis fica para depois, quando houver mais de uma instância ou deploy sem queda; `PresenceStore` e `RoomStateStore` são abstract class para a troca)*. Se o processo reiniciar, os clientes reconectam e reenviam o estado (sala atual, mute, transmissão).

**Camadas por módulo.** Cada módulo de `src/modules/<nome>` segue a mesma forma:
- `controllers/` e `gateways/`: só traduzem HTTP ou evento para use-case. Sem regra de negócio.
- `use-cases/`: um `@Injectable` por caso de uso, com um único `execute()`. A regra mora aqui.
- `repositories/`: `abstract class` como token de DI, com implementação `prisma/` e `in-memory/`. Os testes unitários usam a in-memory.
- `errors/`: erros de domínio que estendem `DomainError`. Um filtro global converte para HTTP (e para ack com erro no socket).
- `services/` (`*.service.ts`, classe `XxxService`): lógica compartilhada por vários use-cases que não é uma ação por si só, como checar o acesso a um servidor (`ServerAccessService`), montar a resposta dele (`ServerViewsService`) ou resolver o limite efetivo (`EffectiveLimitsService`). Nenhum controller chama um service direto; a dependência é sempre use-case para service, nunca o contrário. *(Decidido em 2026-10-24.)*
- `providers/`: detalhe técnico trocável atrás de uma `abstract class`, para o teste usar um fake: aleatoriedade, hash, API de terceiros (`TokenGenerator`, `InviteCodeGenerator`, `IceProvider`, `SfuProvider`). Organizado primeiro pelo recurso e depois pela implementação *(decidido em 2026-10-27)*:
  - `providers/<recurso>/<recurso>.provider.ts`: o contrato (`abstract class`) e os tipos dele;
  - `providers/<recurso>/<implementação>/<implementação>.<recurso>.provider.ts`: cada implementação na própria pasta, com o spec e os arquivos só dela (por exemplo `cloudflare-sfu.schemas.ts`). Exemplos: `ice/providers/ice/cloudflare/`, `media/providers/sfu/not-configured/`, `storage/providers/storage/s3/`, `realtime/providers/timers/node/`;
  - fakes de teste continuam em `test/` do módulo.
- `domain/`: tipos, constantes e regras puras, sem I/O (`ServerPermissions`, `serverInviteStatus`).

**Contrato compartilhado.** `packages/contracts` é a fonte da verdade dos formatos: schemas zod de DTOs, payloads de eventos e os tipos `ClientToServerEvents` e `ServerToClientEvents`. Compilado com `tsc` para `dist/` em ESM com `.d.ts` **(suposição)**. A API, em CommonJS no Nest 11, consome via `require(esm)` do Node 24. O web consome direto.
- A API valida tudo com `nestjs-zod` (`createZodDto` + `ZodValidationPipe` global).
- OpenAPI sai do `@nestjs/swagger` 11 e é exibido no Scalar em `/api/docs`.
- AsyncAPI sai do `nestjs-asyncapi` e é exibido em `/api/docs/events` (visualizador do AsyncAPI, ou o Scalar se a integração JS já aceitar).

**REST e socket.** REST para tudo que grava no banco. Socket só para estado efêmero e avisos (ver 3.3.1). Depois de gravar, os use-cases publicam **eventos de domínio** num barramento interno (`@nestjs/event-emitter`) **(suposição)**. Quem escuta são o gateway (emite para os sockets) e o módulo de notificações (grava a notificação do Hub). Assim nenhum módulo REST importa o gateway.

**Auth.** Better Auth montado pelo `@thallesp/nestjs-better-auth`, com os plugins `username`, `admin` e `twoFactor`, e `bodyParser: false` no `main.ts`.
- A sessão vem do cookie. No socket, o handshake lê o mesmo cookie e recusa a conexão se a sessão for inválida.
- Rotas de admin exigem `role = admin` **e** `twoFactorEnabled`. O admin semeado é obrigado a configurar o TOTP no primeiro login.
- O IP vem do `X-Forwarded-For`, com `trust proxy` só para o nginx e o cloudflared.
- Hooks do sign-up:
  - `before` valida e consome a key de cadastro.
  - `after` cria o pedido de entrada quando o cadastro veio de um link de servidor (código no corpo do sign-up).

**Segredos e hash.** A key de cadastro (6 caracteres, ~10⁹ combinações) é guardada como **HMAC-SHA256 com segredo do servidor** (`REGISTRATION_KEY_SECRET`), não como hash puro *(decidido em 2026-10-24)*. Junto fica só o sufixo de 3 caracteres para a listagem. Rate limit nas tentativas de cadastro e login com `@nestjs/throttler`.

**Storage.** `StorageProvider` com drivers `local` (volume servido pelo nginx em `/uploads`), `s3` e `in-memory` (testes), escolhido por `STORAGE_DRIVER`. O `sharp` faz validação por magic bytes, recorte, WebP e remoção de EXIF. O banco guarda só a chave do arquivo.

**ICE.** `IceProvider` escolhido por `ICE_PROVIDER = cloudflare | coturn | stun-only`. A API emite credenciais TURN efêmeras. O mesmo endpoint devolve o IP visto pelo HTTP, para o web comparar com o IP do STUN (aviso de VPN/proxy).

**Configuração.** `EnvService` valida o `process.env` com zod na inicialização e falha cedo. Limites globais e versão mínima do Chromium ficam no banco (`PlatformSettings`), editáveis pelo admin sem redeploy.

**Observabilidade.** Logs pino em JSON com id de requisição. OpenTelemetry exportando para o Grafana Cloud. Healthcheck em `/api/health`, que verifica o banco.

**Testes.** Unitários (Vitest) nos use-cases com repositórios e storage in-memory. E2E (Vitest + supertest) contra Postgres em Docker, com `test/factories/`. Socket testado com `socket.io-client` nos e2e.

**Restrições.**
- Chromium como alvo.
- Mídia sempre P2P em mesh, e a API nunca toca a mídia.
- Tudo cabe no free tier (Neon, Cloudflare TURN, Grafana Cloud).

**Fora deste plano.** SFU, chat, push-to-talk, ban, transferência de posse, checagem de VPN por faixa de IP ou fuso.

## 2. Modelo de dados

Postgres + Prisma 7. Os ids são `cuid` em texto **(suposição)**, e todas as tabelas têm `createdAt`. As tabelas do Better Auth são geradas pelo CLI dele e recebem campos extras.

```prisma
// auth.prisma (Better Auth + campos do app)
model User {
  id String @id
  email String @unique
  username String @unique          // plugin username (normalizado)
  displayUsername String?
  role String @default("user")     // plugin admin: "user" | "admin" (admin da plataforma)
  banned Boolean @default(false)   // suspensão
  twoFactorEnabled Boolean @default(false)
  avatarKey String?
  theme Theme @default(DARK)       // lembrado por usuário (2.11)
  locale String?                   // "en" | "pt", null = detectar
  maxServersOverride Int?          // override de limite (2.2)
  // sessions, accounts, twoFactor, memberships, notifications, devices...
}
// Session (ipAddress, userAgent), Account, Verification, TwoFactor: formato do Better Auth.

model PlatformSettings {           // linha única, id fixo "global"
  id String @id @default("global")
  maxServersPerUser Int @default(1)
  maxMembersPerServer Int @default(10)
  maxRoomsPerServer Int @default(2)
  minChromiumVersion Int @default(130)
}

model RegistrationInvite {
  id String @id @default(cuid())
  keyHmac String @unique
  keySuffix String                 // 3 últimos caracteres, para a lista
  expiresAt DateTime               // 1, 7 ou 30 dias
  revokedAt DateTime?
  createdById String
  usedById String? @unique
  usedAt DateTime?
}

model Server {
  id String @id @default(cuid())
  name String
  description String?
  iconKey String?
  coverKey String?
  autoApprove Boolean @default(false)
  ownerId String
  maxMembersOverride Int?
  maxRoomsOverride Int?
}

model ServerMember {
  serverId String
  userId String
  role ServerRole                  // OWNER | ADMIN | MEMBER
  inviteId String?                 // por qual convite entrou
  joinedAt DateTime @default(now())
  @@id([serverId, userId])
}

model ServerInvite {
  id String @id @default(cuid())
  serverId String
  code String @unique              // 8 caracteres, vai no link
  createdById String
  expiresAt DateTime               // createdAt + 1 hora
  revokedAt DateTime?
  usedById String?
  usedAt DateTime?
}

model JoinRequest {
  id String @id @default(cuid())
  serverId String
  userId String
  inviteId String @unique          // convite consumido na criação
  status JoinStatus                // PENDING | APPROVED | DECLINED
  decidedById String?
  decidedAt DateTime?
}

model Room {
  id String @id @default(cuid())
  serverId String
  name String
  position Int
}

model Notification {
  id String @id @default(cuid())
  userId String
  type NotificationType            // JOIN_REQUEST_SENT, JOIN_APPROVED, KICKED, SERVER_DELETED, PROMOTED, DEMOTED, INVITE_EXPIRED
  payload Json                     // ids e nomes para montar o texto via i18n
  dismissedAt DateTime?
}

model DeviceReport {
  id String @id @default(cuid())
  userId String
  deviceId String                  // uuid gerado pelo web e guardado no browser
  collected Json                   // o que o browser expõe (2.12)
  manual Json?                     // informado pelo usuário
  collectedAt DateTime
  @@unique([userId, deviceId])
}
```

Relações e regras de integridade:
- Excluir um `Server` apaga em cascata `ServerMember`, `ServerInvite`, `JoinRequest` e `Room`.
- Excluir um `User` não está no MVP. A suspensão usa `banned`.
- **Um owner por servidor**: `Server.ownerId` mais o `ServerMember` com `OWNER`, mantidos juntos na mesma transação.
- **Limite de membros**: contado em `ServerMember` dentro de uma transação, ao aprovar o pedido e ao gerar convite.
- **Pedido pendente único por (servidor, usuário)**: garantido no use-case.
- **Notificações dos alertas do browser** (browser, aceleração, monitores) não vão para o banco. São calculadas no web **(suposição)**. Só os avisos de eventos são persistidos.
- **Pedido recusado**: o convite continua usado.
- **Servidor novo**: nasce com uma sala, numa transação.

## 3. Arquitetura de componentes

| Módulo | Responsabilidade | Depende de |
|---|---|---|
| `env`, `lib/prisma`, `lib/logger`, `lib/otel` | configuração validada, cliente do banco, logs, traces | |
| `common` | `DomainError` e filtro, `ZodValidationPipe`, `@CurrentUser`, `AuthGuard`, `@PlatformAdmin()`, throttler | auth |
| `auth` (`lib/auth.ts`) | instância Better Auth, hooks do sign-up, seed do admin | registration-invites, memberships |
| `registration-invites` | gerar, listar, revogar e consumir keys | |
| `limits` | `PlatformSettings` e overrides; `EffectiveLimitsService` | |
| `storage` | `StorageProvider`, `ImageProcessor` | |
| `accounts` | perfil, avatar, tema e idioma, hardware por dispositivo | storage |
| `servers` | criar (limite), editar, ícone e cover, auto aprovação, excluir; salas | limits, storage |
| `server-invites` | gerar (bloqueio no limite), revogar, resolver código do link | limits, servers |
| `memberships` | pedir entrada, aprovar e recusar, kick, promover e rebaixar, sair | limits, server-invites |
| `notifications` | grava avisos a partir de eventos de domínio; listar, dispensar, limpar | barramento |
| `realtime` | gateway Socket.IO: presença, salas de voz, sinalização, estado de voz e transmissão | auth, servers, memberships, barramento |
| `ice` | credenciais TURN por provider; IP visto pelo HTTP | |
| `platform-admin` | usuários com presença, sessões, servidores, suspender, encerrar sessões, excluir servidor, redefinir senha, resumo de hardware, configurações | auth, limits, servers, realtime |

Interfaces centrais (as implementações ficam nos tickets):

```ts
export abstract class StorageProvider {
  abstract put(key: string, body: Buffer, contentType: string): Promise<void>
  abstract delete(key: string): Promise<void>
  abstract publicUrl(key: string): string
}

export abstract class IceProvider {
  abstract issue(userId: string): Promise<{ iceServers: RTCIceServerDto[]; ttlSeconds: number }>
}

// Eventos de domínio no barramento interno (nome: payload)
export type DomainEvents = {
  'membership.join-requested': { serverId: string; userId: string }
  'membership.approved': { serverId: string; userId: string }
  'membership.declined': { serverId: string; userId: string }
  'membership.removed': { serverId: string; userId: string; reason: 'kick' | 'leave' }
  'membership.role-changed': { serverId: string; userId: string; role: 'ADMIN' | 'MEMBER' }
  'server.deleted': { serverId: string; memberIds: string[] }
  'room.changed': { serverId: string }
  'user.suspended': { userId: string }
  'user.sessions-revoked': { userId: string }
}
```

Contrato do socket (`packages/contracts/src/realtime`, nomes no formato `dominio:acao`):

```ts
export interface ClientToServerEvents {
  'server:subscribe': (p: { serverId: string }, ack: Ack) => void          // passa a receber presença e salas do servidor aberto
  'room:join': (p: { roomId: string }, ack: Ack<{ participants: Participant[] }>) => void
  'room:leave': () => void
  'voice:state': (p: { muted: boolean; deafened: boolean }) => void
  'stream:start': (p: { preset: StreamPreset }) => void
  'stream:stop': () => void
  'stream:watch': (p: { streamerId: string }) => void
  'stream:unwatch': (p: { streamerId: string }) => void
  'stream:quality': (p: { streamerId: string; level: 'auto' | 'high' | 'medium' | 'low' }) => void
  'signal:send': (p: { to: string; kind: 'offer' | 'answer' | 'candidate'; data: unknown }) => void
}

export interface ServerToClientEvents {
  'presence:snapshot': (p: { serverId: string; onlineUserIds: string[]; rooms: RoomOccupancy[] }) => void
  'presence:update': (p: { serverId: string; userId: string; online: boolean }) => void
  'room:participants': (p: { roomId: string; participants: Participant[] }) => void
  'stream:watch-request': (p: { viewerId: string }) => void
  'stream:unwatch': (p: { viewerId: string }) => void
  'stream:quality': (p: { viewerId: string; level: 'auto' | 'high' | 'medium' | 'low' }) => void
  'signal:receive': (p: { from: string; kind: 'offer' | 'answer' | 'candidate'; data: unknown }) => void
  'server:changed': (p: { serverId: string }) => void                      // web invalida as queries do servidor
  'server:removed': (p: { serverId: string; reason: 'kicked' | 'deleted' }) => void
  'notification:new': (p: { id: string }) => void
  'session:revoked': () => void                                            // suspensão ou sessões encerradas
}
// Participant: { userId, muted, deafened, streaming: StreamPreset | null }
// Ack<T>: (r: { ok: true; data: T } | { ok: false; error: string }) => void
```

Fluxos ponta a ponta:
- **Entrar na sala de voz:**
  1. O web chama `GET /api/ice` e recebe credenciais e o IP visto pelo HTTP.
  2. O web emite `room:join`. O gateway confere se a pessoa é membro e tira ela da sala anterior (uma sala por vez, também entre abas **(suposição)**).
  3. O gateway responde com os participantes no ack e emite `room:participants` para a sala.
  4. Os peers trocam `signal:send` / `signal:receive` até a conexão P2P abrir.
- **Kick:**
  1. `POST /api/servers/:id/members/:userId/kick` remove o membro e publica `membership.removed`.
  2. O gateway tira a pessoa da sala e emite `server:removed` para ela e `server:changed` para os outros.
  3. O módulo de notificações grava o aviso e emite `notification:new`.
- **Suspensão:** o admin suspende (plugin `admin`). Isso publica `user.suspended`, e o gateway emite `session:revoked` e desconecta todos os sockets da pessoa.

Modos de falha:
- **Queda do socket:** o cliente reconecta sozinho e reenvia `server:subscribe` e `room:join`. O gateway espera alguns segundos antes de anunciar a saída da sala, para evitar a piscada **(decidido: 30 s)**.
- **Queda do processo:** o estado efêmero se perde, e os clientes reconstroem na reconexão.
- **Banco fora:** o healthcheck falha e o REST responde 503. O socket recusa as ações que precisam do banco.
