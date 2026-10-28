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

## Release (Linux)

Actions > **Desktop release** > Run workflow, from `main`. It runs typecheck, lint and the desktop tests, takes the next `0.0.{x}` after the last `v0.0.*` tag, builds the deb and zip and publishes them on GitHub Releases as `v0.0.{x}`. Nothing is committed: the tag is the record of the last version, and `apps/desktop/package.json` stays at `0.0.0`.

What the repository needs (Settings > Secrets and variables > Actions):

| Name                                   | Kind      | What for                                                                             |
| -------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| `GAMEPLAY_SERVER_URL`                  | variable  | The server the installer is tied to (`VITE_SERVER_URL`). The build fails without it. |
| `DESKTOP_SENTRY_DSN`                   | variable  | The Sentry project of the app. Empty keeps Sentry off.                               |
| `SENTRY_ORG`, `DESKTOP_SENTRY_PROJECT` | variables | Where the source maps go.                                                            |
| `SENTRY_AUTH_TOKEN`                    | secret    | Uploads the source maps. Without it, they are not made.                              |

The workflow token (`GITHUB_TOKEN`) publishes the release; nothing else to set up. The production API must already run the code that accepts `app://gameplay` (CORS), or the installer opens on an error screen.
