// Real Auth0 login inside the app (app build only, Phase 5.5). vite.config.app.js points
// '@auth0/auth0-react' here, so every website component keeps importing it unchanged.
//
// The website signs in by sending the whole page to Auth0. Inside the app that can't work
// (Google blocks sign-in inside app web views, and Auth0 can't redirect back into the app's page),
// so here:
//  - sign-in and sign-out open in a secure browser tab (Chrome Custom Tab) over the app;
//  - Auth0 then sends the user back to in.fined.app://<domain>/capacitor/in.fined.app/callback,
//    which Android hands to the app (intent filter in AndroidManifest.xml);
//  - the app finishes the sign-in with that address and closes the tab;
//  - sessions are kept with refresh tokens in the app's storage, so users stay signed in.
// Auth0 dashboard settings this needs are in MOBILE_APP.md (Phase 5.5).
import { useEffect, useMemo } from 'react';
import { CapacitorHttp } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import * as Auth0 from '@fined/auth0-react-original';
import { navigateInApp } from './appNavigate';
import { trackAuthLogin } from '../utils/analytics';

// Everything else (useAuth0, withAuthenticationRequired…) is the original library's.
// eslint-disable-next-line react-refresh/only-export-components -- library shim, not a hot-reloaded component file
export * from '@fined/auth0-react-original';

const APP_ID = 'in.fined.app';
const nativeCallbackUrl = (domain) => `${APP_ID}://${domain}/capacitor/${APP_ID}/callback`;

const openInBrowserTab = (url) => Browser.open({ url, toolbarColor: '#4100BC' });

// Auth0 only accepts token requests made from a web page if that page's address is on its allowed
// list, and the app's address (https://localhost) can only be listed by switching on cross-origin
// login for the whole tenant, website included. So the app sends just this one request (sign-in
// and refresh) through Android, where that browser rule (CORS) doesn't apply. Every other request
// uses the normal fetch.
let tokenRouteInstalled = false;
function sendTokenRequestsThroughAndroid(domain) {
  if (tokenRouteInstalled || !domain) return;
  tokenRouteInstalled = true;
  const tokenUrl = `https://${domain}/oauth/token`;
  const browserFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (url !== tokenUrl) return browserFetch(input, init);

    const headers = Object.fromEntries(new Headers(init.headers || {}).entries());
    const body = typeof init.body === 'string' ? init.body : '';
    const isForm = (headers['content-type'] || '').includes('x-www-form-urlencoded');
    let response;
    try {
      response = await CapacitorHttp.post({
        url,
        headers,
        data: isForm ? Object.fromEntries(new URLSearchParams(body)) : JSON.parse(body || '{}'),
      });
    } catch {
      throw new TypeError('Failed to fetch'); // what the library expects for a network error
    }
    const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data ?? {});
    return new Response(data, { status: response.status, headers: { 'Content-Type': 'application/json' } });
  };
}

function NativeLoginBridge({ callbackUrl, children }) {
  const auth = Auth0.useAuth0();
  const { handleRedirectCallback } = auth;

  // Auth0 sends the user back to the app: finish sign-in (or sign-out) and close the tab.
  useEffect(() => {
    const handled = new Set();
    const onUrl = async (url) => {
      if (!url?.startsWith(callbackUrl) || handled.has(url)) return;
      handled.add(url);
      Browser.close().catch(() => {});
      const query = new URL(url).searchParams;
      if (!query.has('state') || !(query.has('code') || query.has('error'))) return; // back from sign-out
      try {
        const result = await handleRedirectCallback(url);
        trackAuthLogin('auth0'); // the website sends this from its own callback, which the app skips
        navigateInApp(result?.appState?.returnTo || '/dashboard', { replace: true });
      } catch {
        // Cancelled, expired, or the app restarted mid-login: back to the welcome screen to try again.
        navigateInApp('/', { replace: true });
      }
    };
    const listener = App.addListener('appUrlOpen', ({ url }) => onUrl(url));
    // Android may close the app while the sign-in tab is open; then the callback starts it fresh.
    App.getLaunchUrl()
      .then((launch) => onUrl(launch?.url))
      .catch(() => {});
    return () => {
      listener.then((l) => l.remove()).catch(() => {});
    };
  }, [callbackUrl, handleRedirectCallback]);

  const value = useMemo(
    () => ({
      ...auth,
      loginWithRedirect: (options = {}) => auth.loginWithRedirect({ ...options, openUrl: openInBrowserTab }),
      logout: async (options = {}) => {
        await auth.logout({
          ...options,
          logoutParams: { ...options.logoutParams, returnTo: callbackUrl },
          openUrl: openInBrowserTab,
        });
        navigateInApp('/', { replace: true });
      },
    }),
    [auth, callbackUrl],
  );

  return <Auth0.Auth0Context.Provider value={value}>{children}</Auth0.Auth0Context.Provider>;
}

export function Auth0Provider({ authorizationParams, children, ...options }) {
  const callbackUrl = nativeCallbackUrl(options.domain);
  sendTokenRequestsThroughAndroid(options.domain);
  return (
    <Auth0.Auth0Provider
      {...options}
      cacheLocation="localstorage"
      useRefreshTokens
      useRefreshTokensFallback={false} // the silent-iframe fallback can't work in an app
      useCookiesForTransactions // login state survives Android closing the app mid-login
      skipRedirectCallback // the app finishes sign-in itself, from the callback address
      authorizationParams={{ ...authorizationParams, redirect_uri: callbackUrl }}
    >
      <NativeLoginBridge callbackUrl={callbackUrl}>{children}</NativeLoginBridge>
    </Auth0.Auth0Provider>
  );
}
