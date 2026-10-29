# Gameplay

Gameplay é uma alternativa leve ao Discord para salas de voz, compartilhamento de tela e pequenos grupos. O projeto é um monorepo com npm workspaces e Turborepo.

## Organização do repositório

| Caminho                   | Responsabilidade                                                      |
| ------------------------- | --------------------------------------------------------------------- |
| `apps/api`                | API NestJS, autenticação Better Auth, Prisma, Postgres e Socket.IO    |
| `apps/web`                | Shell Vite do navegador e testes e2e com Cypress                      |
| `apps/desktop`            | Aplicação Electron para Windows e Linux                               |
| `packages/client`         | Front-end React compartilhado pelo web e desktop, incluindo Storybook |
| `packages/contracts`      | Schemas Zod e eventos tipados compartilhados pela API e pelo client   |
| `packages/desktop-bridge` | Contrato tipado entre renderer e processo principal do Electron       |
| `packages/env`            | Schemas de configuração do ambiente                                   |
| `infra/self-hosted`       | Docker Compose, CLI e configuração para hospedar localmente           |
| `infra/windows-dev`       | VM Windows para testes manuais do desktop                             |
| `plans`                   | Planejamento técnico e tickets, escritos em português                 |

O front-end segue MVVM. O Model fica em `packages/client/src/modules/<m>/model`, o ViewModel em `view-models` e as Views em `views`. As Views não acessam router, query, store, Electron ou APIs diretamente.

## Requisitos gerais

- Git.
- Node.js 24 e npm 11. O campo `engines` do projeto exige Node 24 ou superior.
- Docker Engine com Docker Compose v2 para Postgres, self-hosted e a VM Windows.
- Dependências instaladas na raiz com `npm ci`.

Confira as instruções específicas antes de começar em uma máquina nova.

## Debian e Ubuntu

### Instalação recomendada

```bash
sudo apt update
sudo apt install -y \
  git curl ca-certificates build-essential pkg-config \
  dpkg fakeroot \
  libgtk-3-0 libnss3 libgbm1 libasound2 libxss1 libxtst6 \
  libnotify4 libdrm2 libxkbcommon0 libxrandr2 \
  xvfb
```

Em versões que usam o pacote com ABI `t64`, substitua `libasound2` por `libasound2t64` quando o apt solicitar.

Para desenvolver o auxiliar de áudio Windows a partir do Linux:

```bash
sudo apt install -y mingw-w64
```

Para criar o instalador Squirrel Windows localmente no Linux, além do MinGW:

```bash
sudo apt install -y wine mono-complete
```

Para usar a VM Windows e abrir uma sessão RDP:

```bash
sudo apt install -y freerdp3-x11
```

Docker deve estar instalado e o usuário de desenvolvimento deve conseguir executar `docker` sem `sudo`. Depois de instalar o Docker, faça login novamente ou execute `newgrp docker`.

### Node e dependências

Instale Node 24 por um gerenciador como nvm ou pelo método aprovado pela sua distribuição. Em seguida, na raiz:

```bash
npm ci
```

### Diagnóstico de instalação

```bash
node --version
npm --version
docker compose version
```

## Windows

Para desenvolvimento nativo do desktop:

- Windows 10 ou superior.
- Node.js 24 e npm 11.
- Git for Windows.
- Visual Studio Build Tools com o workload **Desktop development with C++**, caso algum módulo nativo precise ser compilado.
- Docker Desktop com integração WSL2, se a API, self-hosted ou a VM Windows forem usadas localmente.

Na raiz do projeto:

```powershell
npm ci
```

O build nativo do auxiliar WASAPI e a publicação oficial do instalador Windows acontecem no workflow do GitHub Actions. Para testar um instalador dentro da VM Windows a partir do Linux, use `windows-dev:up`, `windows-dev:rdp` e `windows-dev:ssh`.

## Comandos por aplicação

Os comandos da raiz seguem o formato `pacote:comando`. Assim, o alvo de cada ação fica explícito.

### API

```bash
npm run api:db-up
npm run api:dev
npm run api:test
npm run api:test-e2e
npm run api:build
```

A API roda em `http://localhost:3333`. O banco de desenvolvimento usa a porta 5432 e é separado do banco self-hosted.

### Web

```bash
npm run web:dev
npm run web:build
npm run web:e2e
```

O shell web roda em `http://localhost:5173` quando iniciado pelo Vite.

### Client e Storybook

```bash
npm run client:storybook
npm run client:build-storybook
npm run client:test
```

O Storybook roda em `http://localhost:6006`. As telas novas devem ser criadas e aprovadas no Storybook antes da integração com as rotas do produto.

### Desktop

```bash
cp apps/desktop/.env.example apps/desktop/.env
npm run desktop:dev
npm run desktop:package
npm run desktop:make
```

`desktop:dev` inicia o Electron. `desktop:make` gera os instaladores em `apps/desktop/out/make`. O `VITE_APP_ENV` pode ser `development` ou `production`; um build de produção exige `VITE_SERVER_URL`.

### Self-hosted

```bash
npm run self-hosted:start
npm run self-hosted:logs
npm run self-hosted:stop
```

O CLI cria e valida `infra/self-hosted/.env`, `.env.api` e `.env.web`, aplica migrations, builda API e web, sobe os containers e espera o health check. Não execute o Compose manualmente sem passar os três arquivos de ambiente.

### VM Windows

```bash
npm run windows-dev:up
npm run windows-dev:rdp
npm run windows-dev:ssh
npm run windows-dev:down
```

A primeira instalação da VM baixa uma ISO e pode levar de 10 a 20 minutos. Os detalhes de SSH, RDP, áudio e cópia do build estão em `infra/windows-dev/README.md`.

## Verificações do monorepo

Use os comandos explícitos abaixo quando a verificação deve cobrir todos os workspaces:

```bash
npm run repo:typecheck
npm run repo:lint
npm run repo:test
npm run repo:format-check
npm run repo:build
```

## Ambientes e credenciais locais

Arquivos `.env` são ignorados pelo Git e possuem exemplos próximos. Não commite segredos.

- Desktop: `apps/desktop/.env`.
- Self-hosted: `infra/self-hosted/.env`, `.env.api` e `.env.web`.
- API de desenvolvimento: `apps/api/.env` e o Postgres de `api:db-up`.

O seed local documentado no ambiente pode criar um admin. Use a senha definida no arquivo de ambiente, sem colocá-la em commits ou mensagens públicas.

## Documentação complementar

- API: [`apps/api/README.md`](apps/api/README.md)
- Desktop: [`apps/desktop/README.md`](apps/desktop/README.md)
- Self-hosted: [`infra/self-hosted/README.md`](infra/self-hosted/README.md)
- VM Windows: [`infra/windows-dev/README.md`](infra/windows-dev/README.md)
- Planejamento: [`plans/PROGRESS.md`](plans/PROGRESS.md)
