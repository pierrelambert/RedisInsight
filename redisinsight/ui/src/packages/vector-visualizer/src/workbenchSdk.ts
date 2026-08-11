import {
  executeRedisCommand,
  getState,
  setState,
  // @ts-expect-error Vite resolves the internal plugin SDK alias; aggregate CJS tsc does not.
} from 'redisinsight-plugin-sdk'

import { createWorkbenchHostBinding } from './workbenchIntegration'

/** The only SDK bridge: caller-visible follow-ups and selection-only state. */
export const workbenchHost = createWorkbenchHostBinding({
  executeRedisCommand: (command) => executeRedisCommand(command),
  getState: () => getState(),
  setState: (state) => setState(state),
})

/** Activation obtains this bridge; it never triggers a Redis command by itself. */
export const getWorkbenchHost = () => workbenchHost
