import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react"
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    initialScope: { tags: { platform: Capacitor.getPlatform() } }, // 'web' on the site, 'android' / 'ios' in the app
    // Session replays run on the website only. The Android app sends errors and performance timings
    // but no replays (its privacy policy and Play data-safety answers list crash reports only).
    integrations: import.meta.env.VITE_NATIVE_APP === 'true'
      ? [Sentry.browserTracingIntegration()]
      : [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: import.meta.env.VITE_NATIVE_APP === 'true' ? 0 : 0.1,
    replaysOnErrorSampleRate: import.meta.env.VITE_NATIVE_APP === 'true' ? 0 : 1.0,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
