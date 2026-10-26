import { defineConfig } from 'cypress'

import { afterRun, createTasks } from './cypress/tasks/register-tasks.ts'
import { FAKE_MEDIA_ARGS } from './cypress/tasks/peer-bot.ts'
import { createRunId } from './cypress/tasks/run-id.ts'

export default defineConfig({
  e2e: {
    // Better Auth only trusts this origin, so the app has to be on 5173 (the Vite proxy serves /api and /socket.io).
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    setupNodeEvents(on) {
      // Fake mic and screen, and no permission prompts, so voice and screen share work headless.
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') launchOptions.args.push(...FAKE_MEDIA_ARGS)
        return launchOptions
      })
      const runId = createRunId()
      on('task', createTasks(runId))
      // Everything the run created goes away when it ends, whether the specs passed or not.
      on('after:run', () => afterRun(runId))
    },
  },
})
