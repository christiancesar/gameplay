# AGENTS.md

Gameplay: voice rooms and screen sharing for small groups (Discord alternative). Monorepo with npm workspaces + Turborepo: `apps/api` (NestJS 11, Prisma 7, Postgres, Better Auth, Socket.IO), `apps/web` (thin Vite shell for the browser, plus the Cypress e2e), `packages/client` (the whole front-end: React 19, Vite 8, Tailwind 4, shadcn, Storybook 10, shared by the web and the future desktop app), `packages/contracts` (zod schemas and typed Socket.IO events shared by the API and the client).

Planning docs are in Portuguese, in `plans/`. Write code, comments and commits in English. Write docs, plans and ticket notes in Portuguese.

## How to pick up work

1. Read `plans/PROGRESS.md`, section "Frontend (`apps/web`), retomar daqui".
2. Read `plans/05-web-plan.md` (tools, route tree, layer rules).
3. Open `plans/tickets/README.md`, take the next pending FE ticket whose dependencies are done, and read the ticket file.
4. Follow the ticket's scope and checklist. Stay inside "Escopo"; anything in "Fora do escopo" belongs to another ticket.
5. When done: tick the checklist, add a "Notas da execução" section to the ticket (what you did, and every assumption you made marked as *(suposição)*), set the status in `tickets/README.md` to `concluído`, and update `plans/PROGRESS.md`.
6. **Stop after each ticket** so the user can review. Do not start the next one on your own.

Each new plan gets its own directory, `plans/<plan>/`, with `00-requirements.md`, `01-epic-brief.md`, `02-tech-plan.md` and `tickets/` (a `README.md` with the status table plus one file per ticket). The files at the root of `plans/` and `plans/tickets/` are the original MVP plan. Current plans: `plans/desktop-electron/`, `plans/api-realtime-boundaries/`.

## Git

- Two long-lived branches: `dev` (integration) and `main` (release). Never commit or push straight to either.
- Every branch (`feature/...`, `fix/...`, `chore/...`, `docs/...`) starts from an up-to-date `dev` and goes back through a PR into `dev`.
- `main` only receives PRs from `dev`, when the user decides to release.
- Commit at every green step (typecheck, lint and tests passing), not one big commit at the end.
- Conventional commit messages (`feat(web): ...`, `fix(api): ...`, `docs(plans): ...`).

## Frontend architecture (MVVM, strict)

MVVM is the architecture of the whole frontend, not just state management. The frontend lives in `packages/client`; every path below is relative to `packages/client/src`. `apps/web` only mounts the `App` of the client (`src/main.tsx`) and points the router plugin and Tailwind at the package.

| Layer | Where | May use |
|---|---|---|
| Model | `modules/<m>/model/`: `entities/`, `rules/` (pure functions), `*.schema.ts` (zod forms, messages are i18n keys), `*.search.ts` (route search schemas), `services/` (Axios, Socket.IO, media), `mappers/` | `@gameplay/contracts` |
| ViewModel | `modules/<m>/view-models/use-xxx.view-model.ts` + `.spec.ts`, `stores/` (zustand, client state only). Orchestrates TanStack Query, stores, services and rules. No JSX. | Model |
| View | `modules/<m>/views/*.view.tsx` (already exist, with stories). Props and callbacks only. No query, store, axios, router or business rule. The View owns `useForm` with the Model schema and calls `onSubmit(values)`; server errors come by prop through `useServerErrors` (`shared/lib/form.ts`). | `shared/ui`, Model schemas |
| Screen | `modules/<m>/screens/*.screen.tsx`. Thin glue: calls the ViewModel, passes the result to the View. | ViewModel, View |

- Routes live in `packages/client/src/app/routes` (TanStack Router, file based). A route file only declares `validateSearch`, `beforeLoad`, `loader` and `component: XxxScreen`.
- What differs between hosts (browser, desktop) goes through the `Platform` port in `shared/platform` (`capabilities`, `capture`, and `server`: where the API is and the session token, read on every request by `http`, the socket and `authClient`). The `App` takes it as a prop; React code reads it with `usePlatform()`, controllers outside React with `currentPlatform()`. Never import a browser capture API or Electron in a ViewModel. Specs and stories use `FakePlatform`.
- Views never use `Link` or `useNavigate`; navigation arrives as a callback. Storybook must keep working without a router.
- Socket events only invalidate queries or update stores. REST stays the source of truth.
- One component per file in our code (`shared/ui` from shadcn and `*.stories.tsx` are exempt).
- Every new View or changed View state gets a story; keep the existing interaction tests green.
- Styling: shadcn neutral palette as is, Tailwind colors for accents (emerald, red, amber). Never sample custom colors from mocks. Headings in Space Grotesk, everything else Geist.
- All user-facing text goes through i18n (`shared/i18n/locales/en.json` and `pt.json`), both languages.

## Tests

- Keep data and factories apart: one fake class per file, seed data as plain constants in its own file, context or factory wiring in another. No setup helpers piling up inside specs.
- API: unit specs use `test/<module>-context.ts` over `test/<module>-seed.ts`; e2e factories in `test/factories/`.
- Client: ViewModels with `renderHook` in the `unit` Vitest project; services and transports tested with fakes. Stories run in the `storybook` Vitest project. Both live in `packages/client` (`npm test` from the root runs them). Cypress e2e stays in `apps/web`.

## Commands

From the repo root: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run dev`, `npm run storybook`. `npm run e2e` (Cypress, in `apps/web`) needs the local API on 3333 and `npm run dev -w web` on 5173.

Local API for manual testing: `npm run db:up` in `apps/api` (dev-only Postgres on 5432 from `apps/api/docker-compose.yml`; the e2e tests create `gameplay_test` there), then `npm run dev` (API on 3333). Seeded admin: `admin@gameplay.local` / `admin-pass-123`. If `prisma migrate dev` hangs with no output, run it with `< /dev/null`.

Before using a library API from memory (TanStack Router/Query, Better Auth, zod, Socket.IO), check its current docs.

## Working with the user

- MVP mindset: keep scope lean, no compliance extras unless asked.
- When the user answers a design question with their own proposal or an open question, reply with an analysis and wait for a go-ahead before implementing.
- Mark your own assumptions explicitly in the ticket notes so the user can confirm them.
- In any user-facing text, never use the em dash character; use a comma, a period or a separate sentence. Write plainly, without inflated or salesy phrasing.
