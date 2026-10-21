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
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0, 
    replaysSessionSampleRate: 0.1, 
    replaysOnErrorSampleRate: 1.0, 
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
