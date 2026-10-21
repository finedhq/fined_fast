// Mobile app build only (replaces appShell.js via vite.config.app.js): the tab bar + top bar layout.
import { lazy } from 'react';

export default lazy(() => import('./AppLayout'));
