// PHONE TEST ONLY: a signed-in stand-in for @auth0/auth0-react (fake admin), so the app can be
// tried before real Auth0 login exists. Used by vite.config.apptest.js. Never part of a real build.
const ADMIN = {
  email: "admin@local.test",
  name: "Local Admin",
  nickname: "local-admin",
  sub: "local|admin",
  "https://fined.com/roles": ["Admin"],
};

const state = {
  user: ADMIN,
  isAuthenticated: true,
  isLoading: false,
  error: undefined,
  loginWithRedirect: async () => {},
  loginWithPopup: async () => {},
  logout: () => {},
  getAccessTokenSilently: async () => null, // no token -> dev backend treats request as admin
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
