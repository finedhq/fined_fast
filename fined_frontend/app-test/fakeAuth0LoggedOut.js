// PHONE TEST ONLY: a logged-out stand-in for @auth0/auth0-react, to preview the app's welcome
// screen. Used by vite.config.apptest.js when FAKE_LOGGED_OUT=1. Never part of a real build.
const state = {
  user: undefined,
  isAuthenticated: false,
  isLoading: false,
  error: undefined,
  loginWithRedirect: async (opts) => {
    window.__lastLoginCall = opts ?? {};
  },
  loginWithPopup: async () => {},
  logout: () => {},
  getAccessTokenSilently: async () => null,
  getIdTokenClaims: async () => ({}),
};

export function Auth0Provider({ children }) {
  return children;
}

export function useAuth0() {
  return state;
}

export function withAuthenticationRequired(Component) {
  return Component;
}
