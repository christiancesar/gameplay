# Produção

Stack da API na instância Lightsail criada por `infra/terraform`. O plano completo está em `plans/06-producao-aws.md`.

```
navegador -> Cloudflare (proxy, Full strict) -> nginx :443 -> api
```

O web fica no Cloudflare Workers, o banco no Prisma Postgres e os uploads no S3. O servidor roda só dois containers: a API e o nginx.

## Arquivos

| Arquivo               | Onde fica no servidor                                     | Papel                                                                            |
| --------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `docker-compose.yml`  | `/opt/gameplay/docker-compose.yml`                        | API e nginx, logs com rotação, sem volumes                                       |
| `nginx.conf`          | `/opt/gameplay/nginx.conf`                                | TLS com o certificado de origem, `/api/` e `/socket.io/` para a API, o resto 404 |
| `.env` (gitignored)   | `/opt/gameplay/.env`, modo 600                            | O compose passa para a API só as variáveis que ela lê                            |
| certificado de origem | `/opt/gameplay/certs/origin.pem` e `origin.key`, modo 600 | Sai dos outputs do Terraform                                                     |

A imagem da API não é construída no servidor. O deploy manda a imagem por SSH e define `API_TAG` (o SHA do commit). As migrações rodam desta máquina, pelo `DIRECT_URL`.

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
docker compose up -d --wait        # depois de trocar o API_TAG no .env
```
