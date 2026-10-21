// Android back button (app build only):
//  - inside a screen: go back one step
//  - on Courses / Articles / Profile: go to Home
//  - on Home: press back twice within 2 seconds to leave the app
import { App } from '@capacitor/app';
import { navigateInApp } from './appNavigate';
import { TAB_ROOTS } from './nativeApp';

const HOME = '/dashboard';
let lastBackOnHome = 0;

const goTo = (path) => navigateInApp(path, { replace: true });

function showExitHint() {
  const hint = document.createElement('div');
  hint.textContent = 'Press back again to exit';
  hint.setAttribute('role', 'status');
  hint.style.cssText =
    'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:9999;padding:10px 16px;' +
    'border-radius:999px;background:#171321;color:#fff;font:600 14px Manrope,sans-serif;pointer-events:none';
  document.body.appendChild(hint);
  setTimeout(() => hint.remove(), 2000);
}

export function setupBackButton() {
  App.addListener('backButton', ({ canGoBack }) => {
    const path = window.location.pathname;
    if (path === HOME || path === '/') {
      const now = Date.now();
      if (now - lastBackOnHome < 2000) App.exitApp();
      else {
        lastBackOnHome = now;
        showExitHint();
      }
      return;
    }
    if (TAB_ROOTS.includes(path)) return goTo(HOME);
    if (canGoBack && (window.history.state?.idx ?? 0) > 0) return window.history.back();
    goTo(HOME);
  });
}
