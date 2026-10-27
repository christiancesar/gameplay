# Gameplay em casa (self-hosting)

Roda o Gameplay no seu PC Linux e compartilha com amigos pela internet usando um Cloudflare Tunnel. Só o nginx fica atrás do túnel. A API não tem porta no host, e o Postgres só tem uma em `127.0.0.1` (padrão 5433, `POSTGRES_HOST_PORT`), usada pelas migrations.

```
navegador -> Cloudflare -> cloudflared -> web (nginx) -> api -> postgres
```

O túnel carrega só HTTP e WebSocket. O áudio vai entre os navegadores (WebRTC), com TURN da Cloudflare quando a conexão direta falha. A tela vai pelo SFU da Cloudflare ou direto (Mesh), conforme a escolha de quem compartilha.

Esta stack simula a produção (`infra/production`) com os mesmos nomes de variáveis, rotação de logs e healthchecks. Banco e uploads ficam locais. O desenvolvimento e os testes não usam esta stack: o banco de dev fica em `apps/api/docker-compose.yml`.

## Pré-requisitos

- Docker com Compose v2.
- Node 24 e as dependências do repositório (`npm ci` na raiz): as migrations rodam do repositório, com o Prisma CLI, e não de uma imagem.
- Conta na Cloudflare só para túnel nomeado e para o TURN. O modo rápido não precisa de conta.

## Início rápido (sem conta)

Na raiz do repositório:

```bash
npm run host:start
```

Na primeira vez o script cria `infra/self-hosted/.env` com segredos aleatórios e gera a senha do admin (mostrada uma vez, também gravada no `.env`). Depois ele sobe o banco e o túnel, lê a URL `https://*.trycloudflare.com` sorteada, aplica as migrations do repositório, builda as imagens, sobe tudo, cria o admin dentro do container da API e espera `/api/health` responder pela URL pública. No fim imprime o link para compartilhar.

A URL do modo rápido muda a cada reinício. As sessões da URL antiga deixam de valer e os amigos precisam do link novo.

Outros comandos:

```bash
npm run host:logs    # logs de todos os serviços
npm run host:stop    # para a stack e o túnel, mantém os dados
```

Para apagar tudo, inclusive banco e uploads:

```bash
docker compose --project-directory infra/self-hosted --profile quick --profile named --profile token down -v
```

## Como os comandos funcionam

Os comandos `host:*` chamam um pequeno CLI em TypeScript (`cli/`), que o Node 24 roda direto, sem build. Ele faz o que o `docker compose` sozinho não faz: cria o `.env`, descobre a URL do túnel, aplica as migrations, roda o seed do admin e espera a URL pública responder.

| Arquivo              | O que faz                                                                           |
| -------------------- | ----------------------------------------------------------------------------------- |
| `cli/main.ts`        | recebe o comando (`start`, `stop`, `logs`) e mostra os erros                        |
| `cli/commands/`      | um arquivo por comando, com o fluxo em ordem                                        |
| `cli/env-file.ts`    | lê e grava o `.env` (sempre com modo 600)                                           |
| `cli/setup-env.ts`   | cria o `.env` na primeira vez, gera segredos, renomeia chaves antigas e valida tudo |
| `cli/env-sources.ts` | de onde vem cada variável: gerada, padrão, derivada ou externa (com onde obter)     |
| `cli/compose.ts`     | chama o `docker compose` deste diretório                                            |
| `cli/tunnel.ts`      | descobre a URL do modo rápido                                                       |
| `cli/database.ts`    | migrations e seed do admin                                                          |

O `.env` é validado com o schema do pacote `@gameplay/env` (`packages/env/src/self-hosted.ts`), o mesmo pacote que valida a API. O `host:start` gera os segredos que faltam e, se faltar algo que só você tem (por exemplo a chave do TURN com `ICE_PROVIDER=cloudflare`), para antes do build e lista todas as variáveis com problema, com onde conseguir cada uma.

Este diretório é um workspace (`@gameplay/self-hosted`), então `npm run typecheck`, `lint`, `test` e `format:check` na raiz também cobrem o CLI.

## Modos de túnel

Defina `TUNNEL_MODE` no `.env` ou passe o modo ao script (`npm run host:start -- named`).

| Modo    | Endereço                      | Precisa de                                                            |
| ------- | ----------------------------- | --------------------------------------------------------------------- |
| `quick` | aleatório, muda a cada início | nada                                                                  |
| `named` | fixo                          | túnel criado com `cloudflared tunnel create` (arquivo de credenciais) |
| `token` | fixo                          | túnel criado no painel da Cloudflare (token)                          |

### Túnel nomeado com arquivo de credenciais (`named`)

1. Crie o túnel e a rota DNS: `cloudflared tunnel create gameplay` e `cloudflared tunnel route dns gameplay gameplay.seudominio.com`. Cuidado: se existir um `~/.cloudflared/config.yml` de outro túnel, passe `--config /dev/null` ou o comando mira o túnel errado.
2. No `.env`:
   - `TUNNEL_MODE=named`
   - `APP_URL=https://gameplay.seudominio.com`
   - `CLOUDFLARE_TUNNEL_ID=<id do túnel>`
   - `CLOUDFLARE_TUNNEL_CREDENTIALS=/home/voce/.cloudflared/<id>.json`
3. `npm run host:start`. O script deriva `PUBLIC_HOSTNAME` da URL e ajusta `CLOUDFLARED_UID` para o seu usuário, porque o arquivo de credenciais costuma ter modo 400. As regras de ingress (hostname para `http://web:80`, resto 404) ficam no bloco `configs` do compose, sem segredos. O arquivo de credenciais é montado somente leitura e nunca vai para o repositório.

### Túnel nomeado com token (`token`)

1. No painel Cloudflare Zero Trust: Networks > Tunnels > Create a tunnel (Cloudflared). Copie o token.
2. Em Public Hostname, aponte seu hostname para `http://web:80`.
3. No `.env`: `TUNNEL_MODE=token`, `APP_URL=https://seu-hostname`, `CLOUDFLARE_TUNNEL_TOKEN=<token>`.

## TURN da Cloudflare (padrão)

Muitos provedores brasileiros usam CGNAT e a conexão WebRTC direta falha neles. Por isso o padrão é `ICE_PROVIDER=cloudflare`, como em produção.

1. No painel da Cloudflare, abra Realtime > TURN Server e crie uma TURN key. Anote o Key ID e o API token.
2. No `.env`: `CLOUDFLARE_TURN_KEY_ID=...`, `CLOUDFLARE_TURN_API_TOKEN=...`.
3. Rode `npm run host:start` de novo (a API reinicia com a nova configuração).

Sem TURN, use `ICE_PROVIDER=stun-only`. A voz pode não conectar entre algumas pessoas.

## Convidando amigos

O cadastro exige uma chave de registro.

1. Entre como admin (e-mail e senha do `.env`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`).
2. Ative o 2FA em `/admin/setup`. As rotas de admin recusam a conta até isso.
3. Crie chaves em `/admin/keys` e mande a cada amigo o link da stack mais uma chave.
4. Dentro do app, crie um servidor e compartilhe o link de convite dele (`/i/<código>`).

## Atualizando para uma versão nova

```bash
git pull
npm run host:start
```

O script reaplica as migrations a partir do repositório (`prisma migrate deploy` pela porta local do banco), rebuilda as imagens e roda o seed do admin dentro do container da API. O seed é idempotente.

## Documentação da API

A documentação fica pública em `<APP_URL>/api/docs`: REST, rotas de autenticação e eventos do Socket.IO. Os documentos são gerados no build da imagem. Para esconder, use `DOCS_ENABLED=false` no `.env`.

## Observabilidade (Grafana Cloud)

A API manda traces, métricas e logs por OTLP quando `OTEL_EXPORTER_OTLP_ENDPOINT` está preenchido. Sem ele a telemetria fica desligada.

1. No Grafana Cloud, abra o stack > OpenTelemetry > Configure e gere um token. Copie o endpoint e o header `Authorization=Basic ...`.
2. No `.env`: `OTEL_EXPORTER_OTLP_ENDPOINT` e `OTEL_EXPORTER_OTLP_HEADERS`. Os mesmos valores do `apps/api/.env` servem.
3. `npm run host:start` de novo.

No Grafana, os dados deste servidor vêm com `deployment.environment.name=host` (`OTEL_DEPLOYMENT_ENVIRONMENT`), separados do dev.

## Backup

Os dados ficam em dois volumes: `gameplay-host_postgres-data` e `gameplay-host_uploads`.

```bash
# banco
docker compose --project-directory infra/self-hosted exec -T postgres pg_dump -U gameplay gameplay > gameplay.sql

# uploads
docker run --rm -v gameplay-host_uploads:/data:ro -v "$PWD":/backup alpine tar czf /backup/uploads.tgz -C /data .
```

Para restaurar o banco: `docker compose --project-directory infra/self-hosted exec -T postgres psql -U gameplay gameplay < gameplay.sql`.

## Segurança

- Só o nginx fica exposto, e apenas em `127.0.0.1:8080` no host. O acesso externo é pelo túnel. Postgres e API não publicam porta.
- Mantenha o 2FA do admin ligado e guarde o `infra/self-hosted/.env` (está no `.gitignore`). Ele tem os segredos, a senha do admin e o token do túnel.
- Trocar `BETTER_AUTH_SECRET` desloga todo mundo. Trocar `REGISTRATION_KEY_SECRET` invalida as chaves ainda não usadas.
- O nginx repassa o IP real do cliente (`CF-Connecting-IP`) e a API confia em um único salto.
- Quando não estiver testando, rode `npm run host:stop`: sem a stack o link público deixa de funcionar.
