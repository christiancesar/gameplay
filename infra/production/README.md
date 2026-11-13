# Produção

Stack do app (web e API) na instância Lightsail criada por `infra/terraform`. O plano completo está em `plans/[complete]-production-infrastructure/06-producao-aws.md`.

```
navegador -> Cloudflare (proxy, Full strict) -> web (nginx) :443 -> api -> postgres
```

Web e API ficam na mesma origem, `gameplay.oikos.company`, como no self-hosted. O banco é um container Postgres 17 no próprio servidor, com os dados no volume `postgres-data`, e os uploads ficam no S3. O servidor roda três containers: o Postgres, a API e o web (nginx com o build do Vite).

O processo de release Windows, assinatura Authenticode, atualização automática e configuração do feed está em [`docs/windows-release.md`](docs/windows-release.md).

## Arquivos

| Arquivo               | Onde fica no servidor                                     | Papel                                                                                                  |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `docker-compose.yml`  | `/opt/gameplay/docker-compose.yml`                        | Postgres, API e web, logs com rotação, volume `postgres-data` para o banco                             |
| `nginx.conf`          | `/opt/gameplay/nginx.conf`                                | TLS com o certificado de origem, o SPA, `/api/` e `/socket.io/` para a API, túneis do Sentry e do Faro |
| `.env` (gitignored)   | `/opt/gameplay/.env`, modo 600                            | O compose passa para a API só as variáveis que ela lê                                                  |
| certificado de origem | `/opt/gameplay/certs/origin.pem` e `origin.key`, modo 600 | Sai dos outputs do Terraform                                                                           |

As imagens não são construídas no servidor. O deploy manda `gameplay-api` e `gameplay-web` por SSH e define `RELEASE` (o SHA do commit), a mesma tag nas duas. As migrações rodam desta máquina, por um túnel SSH até a porta 5432 do Postgres, que só escuta no `127.0.0.1` do servidor.

## Deploy

Desta máquina, com o código commitado:

```bash
npm run deploy                     # checks, build, envio, migração, subida, seed e tag
npm run deploy -- --skip-checks    # sem typecheck, lint e testes
```

O script (`deploy.sh`) faz, em ordem:

1. Recusa se houver mudança sem commit em `apps/`, `packages/` ou nos arquivos do npm e do turbo. As imagens saem do working tree.
2. Typecheck, lint e testes.
3. Build de `gameplay-api` e `gameplay-web` aqui, com a tag do commit. O web leva o DSN do Sentry, os túneis e envia os source maps.
4. `docker save | gzip | ssh docker load`, as duas imagens num arquivo só.
5. Escreve no servidor o `.env` só com as variáveis que ele usa (sem a senha do admin nem o token do Sentry), o compose e o nginx.
6. Sobe o `postgres` (`docker compose up -d --wait postgres`), abre um túnel SSH de uma porta livre daqui até `127.0.0.1:5432` no servidor e roda `prisma migrate deploy` por ele, antes de trocar os containers. O túnel fecha no fim, mesmo se a migração falhar. Migração precisa funcionar com a versão anterior ainda no ar: adicionar, nunca remover ou renomear no mesmo deploy.
7. `docker compose up -d --wait`. Se não ficar saudável, mostra os logs e volta para o `RELEASE` anterior.
8. Seed do admin (idempotente), pelo stdin, sem a senha aparecer no `ps` do servidor.
9. Confere `https://gameplay.oikos.company/api/health` pela Cloudflare, apaga imagens antigas (mantém a atual e a anterior) e cria a tag `deploy-AAAAMMDD-HHMM` no git local.

## Banco

O Postgres roda no container `postgres`, com os dados no volume `postgres-data`. A porta 5432 só é publicada no `127.0.0.1` do servidor; a API fala com ele pela rede do compose.

A senha é o `POSTGRES_PASSWORD` do `.env`, gerada com `openssl rand -hex 24`. Só letras e números, porque ela entra direto nas URLs de conexão. Não trocar depois da primeira subida: o volume guarda a senha com que foi criado.

Shell no banco, no servidor:

```bash
cd /opt/gameplay
docker compose exec postgres psql -U gameplay gameplay
```

Por enquanto não há backup. Se o disco da instância for perdido, os dados vão junto.

## IP real

O firewall da Lightsail só deixa os IPs da Cloudflare chegarem na 443. Por isso o nginx confia no `CF-Connecting-IP`, grava esse valor no `X-Forwarded-For` e a API confia em um salto (`TRUST_PROXY_HOPS=1`).

## Certificado de origem (uma vez, ou depois de recriar no Terraform)

```bash
cd infra/terraform
SSH="ssh -i ~/.ssh/gameplay-lightsail ubuntu@$(terraform output -raw api_ip)"
$SSH 'install -d -m 700 /opt/gameplay/certs'
terraform output -raw origin_certificate_pem | $SSH 'umask 077 && cat > /opt/gameplay/certs/origin.pem'
terraform output -raw origin_private_key_pem | $SSH 'umask 077 && cat > /opt/gameplay/certs/origin.key'
```

## Comandos no servidor

```bash
cd /opt/gameplay
docker compose ps
docker compose logs -f api
docker compose up -d --wait        # depois de trocar o RELEASE no .env
```
