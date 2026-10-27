# Produção

Stack do app (web e API) na instância Lightsail criada por `infra/terraform`. O plano completo está em `plans/06-producao-aws.md`.

```
navegador -> Cloudflare (proxy, Full strict) -> web (nginx) :443 -> api
```

Web e API ficam na mesma origem, `gameplay.oikos.company`, como no self-hosted. O banco fica no Prisma Postgres e os uploads no S3. O servidor roda só dois containers: a API e o web (nginx com o build do Vite).

## Arquivos

| Arquivo               | Onde fica no servidor                                     | Papel                                                                                                  |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `docker-compose.yml`  | `/opt/gameplay/docker-compose.yml`                        | API e web, logs com rotação, sem volumes                                                               |
| `nginx.conf`          | `/opt/gameplay/nginx.conf`                                | TLS com o certificado de origem, o SPA, `/api/` e `/socket.io/` para a API, túneis do Sentry e do Faro |
| `.env` (gitignored)   | `/opt/gameplay/.env`, modo 600                            | O compose passa para a API só as variáveis que ela lê                                                  |
| certificado de origem | `/opt/gameplay/certs/origin.pem` e `origin.key`, modo 600 | Sai dos outputs do Terraform                                                                           |

As imagens não são construídas no servidor. O deploy manda `gameplay-api` e `gameplay-web` por SSH e define `RELEASE` (o SHA do commit), a mesma tag nas duas. As migrações rodam desta máquina, pelo `DIRECT_URL`.

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
