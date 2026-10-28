# Gameplay desktop

The Electron app: the same front-end as the web (`packages/client`), with what a browser cannot reach. How it is built is in `plans/desktop-electron/`.

## Run it

`cp .env.example .env`, then from the repo root `npm run desktop`. With `VITE_APP_ENV=development` and an empty `VITE_SERVER_URL`, the first screen asks which server to use. Local installers: `npm run desktop:make` (deb and zip in `out/make`).

## The two envs that decide the server

| `VITE_APP_ENV` | `VITE_SERVER_URL` | The app                                                               |
| -------------- | ----------------- | --------------------------------------------------------------------- |
| `production`   | required          | Talks to that server only and never asks. Packaging stops without it. |
| `development`  | optional          | Empty: asks on the first screen. Set: tied to it.                     |

Any other `VITE_APP_ENV`, or none, stops the app and the packaging. The values are baked in at build time. To make your own app, point `VITE_SERVER_URL` at your own server.

## Release (Linux e Windows)

Em Actions > **Desktop release** > Run workflow, escolha `main`. O job Linux roda typecheck, lint e testes, calcula a próxima versão `0.0.{x}` a partir da última tag `v0.0.*`, gera o DEB e o ZIP e cria o release. Em seguida, o job Windows usa a mesma versão, compila o auxiliar WASAPI com MinGW no runner Windows, gera o instalador Squirrel e o ZIP e os anexa ao mesmo release. Nenhuma versão é commitada: a tag registra a última versão, e `apps/desktop/package.json` permanece em `0.0.0`.

O job Windows depende do sucesso do Linux. Se falhar por um motivo transitório depois que o release Linux for criado, execute novamente o job com falha no Actions; o upload substitui os arquivos Windows da mesma versão. Um workflow novo calcularia a próxima versão.

The variables and the secret live in the GitHub environment `electron-production` (Settings > Environments), under the same names as in `.env`. Only `main` may use it.

| Name                           | Kind      | What for                                                         |
| ------------------------------ | --------- | ---------------------------------------------------------------- |
| `VITE_SERVER_URL`              | variable  | The server the installer is tied to. The build fails without it. |
| `VITE_SENTRY_DSN`              | variable  | The Sentry project of the app. Empty keeps Sentry off.           |
| `SENTRY_ORG`, `SENTRY_PROJECT` | variables | Where the source maps go.                                        |
| `SENTRY_AUTH_TOKEN`            | secret    | Uploads the source maps. Without it, they are not made.          |

Set or change them with `gh variable set NAME --env electron-production --body VALUE` and `gh secret set NAME --env electron-production`. `VITE_APP_ENV=production` is fixed in the workflow. The workflow token (`GITHUB_TOKEN`) publishes the release; nothing else to set up. The production API must already run the code that accepts `app://gameplay` (CORS), or the installer opens on an error screen.
