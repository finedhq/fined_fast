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
import { setupLiveUpdates } from './liveUpdate';
import './appFonts.css';
import './appOverrides.css';

// First: confirms this version started fine (live-update rollback check) and, on a cold start,
// switches to a newer downloaded version while the splash is still up.
const switchingToUpdate = setupLiveUpdates();

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
// While switching to a live update the splash stays: the app is about to reload.
function hideSplashWhenReady() {
  const root = document.getElementById('root');
  const hide = () =>
    switchingToUpdate.then((switching) => {
      if (switching) setTimeout(() => SplashScreen.hide().catch(() => {}), 8000); // in case the reload never comes
      else SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
    });
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
