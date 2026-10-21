// Offline banner (app build only): a friendly strip at the top when the phone loses internet,
// on every screen including modules. "Back online" shows briefly when it returns.
import { Network } from '@capacitor/network';

let banner;
let hideTimer;

function show(text, tone) {
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'app-net-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    document.body.appendChild(banner);
  }
  clearTimeout(hideTimer);
  banner.textContent = text;
  banner.dataset.tone = tone;
  banner.classList.add('is-shown');
}

function hide() {
  banner?.classList.remove('is-shown');
}

function onStatus({ connected }, initial = false) {
  if (!connected) return show("You're offline. Reconnect to keep learning.", 'offline');
  if (initial || !banner?.classList.contains('is-shown')) return hide();
  show('Back online', 'online');
  hideTimer = setTimeout(hide, 1800);
}

export function setupOfflineBanner() {
  Network.getStatus()
    .then((status) => onStatus(status, true))
    .catch(() => {});
  Network.addListener('networkStatusChange', (status) => onStatus(status));
}
