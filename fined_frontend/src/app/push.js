// Phone notifications (app build only, Phase 5). Whatever lands in the in-app bell (streaks,
// rewards…) also arrives as a phone notification; the backend sends it through Firebase.
//
// Only switched on in builds made with android/app/google-services.json present (VITE_PUSH_ENABLED):
// without Firebase, registering would crash the app. scripts/app-native.mjs counts that file as a
// native change, so live updates never send push code to an app installed without it.
import { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { navigateInApp } from './appNavigate';

export const PUSH_AVAILABLE = import.meta.env.VITE_PUSH_ENABLED === 'true' && Capacitor.isPluginAvailable('PushNotifications');

const TOKEN_KEY = 'fined.push.token';
const DISMISSED_KEY = 'fined.push.promptDismissed';

const store = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // storage blocked: nothing to remember
    }
  },
};

// Start-up (appEntry.js): listeners go in first, so tapping a notification that opened the app is caught.
export function setupPushListeners() {
  if (!PUSH_AVAILABLE) return;

  PushNotifications.createChannel({
    id: 'fined_updates',
    name: 'Learning updates',
    description: 'Streaks, FinStars and new lessons',
    importance: 4,
  }).catch(() => {});

  PushNotifications.addListener('registration', async ({ value }) => {
    try {
      await api.post('/v1/users/me/push-tokens', { token: value, platform: Capacitor.getPlatform() });
      store.set(TOKEN_KEY, value);
    } catch {
      // backend unreachable: registration is repeated on the next start
    }
  });

  // A notification arriving while the app is open: Android doesn't show it, so show it in the app.
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    const text = notification.body || notification.title;
    if (text) toast(text, { icon: '🔔', duration: 4000 });
  });

  // Tapping a notification: open the screen it points to (data.route), else the notification list.
  PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    const route = notification?.data?.route;
    navigateInApp(typeof route === 'string' && route.startsWith('/') ? route : '/notifications');
  });
}

// Ask Firebase for this phone's address once per app session (both hook users share it).
let registered = false;
function registerOnce() {
  if (registered) return;
  registered = true;
  PushNotifications.register().catch(() => {
    registered = false;
  });
}

// Before signing out: stop sending this account's notifications to this phone.
export async function forgetPushToken() {
  const token = store.get(TOKEN_KEY);
  if (!PUSH_AVAILABLE || !token) return;
  try {
    await api.delete('/v1/users/me/push-tokens', { data: { token } });
  } catch {
    // the backend also drops tokens Firebase reports as dead
  }
  store.set(TOKEN_KEY, null);
  registered = false; // the next account to sign in registers this phone again
}

// Permission state for the signed-in user, and a function to ask for it.
//   status: 'granted' | 'denied' | 'prompt' | 'unavailable'
export function usePhoneNotifications() {
  const { isAuthenticated } = useAuth0();
  const [status, setStatus] = useState(PUSH_AVAILABLE ? 'prompt' : 'unavailable');

  useEffect(() => {
    if (!PUSH_AVAILABLE || !isAuthenticated) return;
    PushNotifications.checkPermissions()
      .then(({ receive }) => {
        setStatus(receive === 'granted' || receive === 'denied' ? receive : 'prompt');
        if (receive === 'granted') registerOnce();
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const enable = useCallback(async () => {
    if (!PUSH_AVAILABLE) return;
    try {
      const { receive } = await PushNotifications.requestPermissions();
      if (receive === 'granted') {
        setStatus('granted');
        registerOnce();
        toast.success("Notifications are on. We'll nudge you to keep your streak.");
      } else {
        setStatus('denied');
        toast('To get notifications, allow them for FinEd in your phone’s Settings → Apps → FinEd.', { duration: 5000 });
      }
    } catch {
      // permission dialog failed to open: nothing changes
    }
  }, []);

  return { status, enable };
}

export const pushPrompt = {
  dismissed: () => store.get(DISMISSED_KEY) === '1',
  dismiss: () => store.set(DISMISSED_KEY, '1'),
};
