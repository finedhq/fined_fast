// Extra start-up code for the mobile app build only (added to the page by vite.config.app.js).
import { SystemBars, SystemBarsStyle } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { setupBackButton } from './backButton';
import { setupExternalLinks } from './externalLinks';
import { setupAppLinks } from './appLinks';
import { setupKeyboard } from './keyboard';
import { setupOfflineBanner } from './offline';
import { setupShareAndSave } from './shareAndSave';
import { setupHaptics } from './haptics';
import './appFonts.css';
import './appOverrides.css';

// Dark status/navigation bar icons on the app's white bars, even when the phone is in dark mode.
SystemBars.setStyle({ style: SystemBarsStyle.Light }).catch(() => {});

setupShareAndSave(); // first, before the site checks navigator.share
setupBackButton();
setupExternalLinks();
setupAppLinks();
setupKeyboard();
setupOfflineBanner();
setupHaptics();

// Keep the branded splash up until React has drawn the first screen, so there's no white flash.
function hideSplashWhenReady() {
  const root = document.getElementById('root');
  const hide = () => SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  if (root?.childElementCount) return hide();
  const observer = new MutationObserver(() => {
    if (root.childElementCount) {
      observer.disconnect();
      hide();
    }
  });
  observer.observe(root, { childList: true });
  setTimeout(hide, 4000); // never leave the splash stuck
}

hideSplashWhenReady();
