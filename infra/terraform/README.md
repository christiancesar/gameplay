# Terraform da produção

Cria a infraestrutura de produção descrita em `plans/[pending]-production-infrastructure/06-producao-aws.md`: Lightsail (web e API), bucket S3 dos uploads com o usuário IAM da API, registro DNS `gameplay.oikos.company` na Cloudflare e o certificado de origem do nginx. Roda desta máquina; nada roda pelo GitHub.

O que fica fora: o banco (Prisma Postgres, criado no Console) e as configurações da zona `oikos.company` (compartilhada com outros projetos; o modo SSL já é Full (strict)). O web roda no mesmo Lightsail que a API (`infra/production`).

## Uso

```bash
cd infra/terraform
cp .env.example .env && chmod 600 .env   # uma vez; preencha as credenciais
set -a && . ./.env && set +a
terraform init
terraform plan -out=tfplan               # mostra o que muda, sem mudar
terraform apply tfplan                   # aplica exatamente o plano revisado
```

Depois do `apply`, os valores do `infra/production/.env` saem dos outputs:

```bash
terraform output -raw api_ip                      # DEPLOY_SSH_HOST
terraform output -raw uploads_bucket              # S3_BUCKET
terraform output -raw uploads_public_url          # PUBLIC_UPLOADS_URL
terraform output -raw uploads_access_key_id       # S3_ACCESS_KEY_ID
terraform output -raw uploads_secret_access_key   # S3_SECRET_ACCESS_KEY
terraform output -raw github_updates_role_arn     # GitHub environment AWS_ROLE_TO_ASSUME
terraform output -raw origin_certificate_pem      # certificado do nginx
terraform output -raw origin_private_key_pem      # chave do nginx
```

## Cuidados

- O `terraform.tfstate` fica nesta máquina, fora do git, e guarda segredos (chave do S3, chave do certificado). Faça backup dele.
- Os updates do Windows usam o mesmo bucket de uploads, no prefixo `updates/windows`. O GitHub Actions publica ali pela Role OIDC `github_updates_role_arn`; nenhuma access key AWS fica no GitHub.
- O IP de SSH é o desta casa (`TF_VAR_ssh_allowed_cidr`). Se a operadora trocar, atualize e rode `plan` e `apply`.
- `bootstrap.sh` só roda no primeiro boot da instância (instala o Docker e cria uma swap de 2 GB). Mudar o arquivo depois não recria o servidor.
