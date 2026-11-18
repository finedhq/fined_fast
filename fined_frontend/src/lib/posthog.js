import posthog from 'posthog-js'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_POSTHOG_HOST

export const isPostHogEnabled = Boolean(posthogKey && posthogHost)

// Only purpose-written calls through this logger are exported as PostHog Logs.
export const posthogLogger = {
  info(message, attributes = {}) {
    if (!isPostHogEnabled) return
    try {
      posthog.logger.info(message, attributes)
    } catch {
      // Log delivery must never interrupt the application.
    }
  },
}

if (isPostHogEnabled) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    defaults: '2026-08-30',
    logs: {
      serviceName: 'fined-frontend',
      environment: import.meta.env.MODE,
    },
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  })
  posthogLogger.info('browser log capture initialized', { runtime: 'browser' })
} else if (import.meta.env.DEV) {
  const missingVariable = posthogKey ? 'VITE_POSTHOG_HOST' : 'VITE_POSTHOG_KEY'
  throw new Error(`${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`)
}

export default posthog
