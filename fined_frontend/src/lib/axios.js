import axios from 'axios';

const rawBase = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();
const baseURL = rawBase.endsWith("/api")
  ? rawBase
  : `${rawBase.replace(/\/+$/, "")}/api`;

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenFetcher = null;
let cachedTokenPromise = null;

export const setTokenFetcher = (fetcher) => {
  tokenFetcher = fetcher;
};

export const getAuthToken = async () => {
  if (!tokenFetcher) return null;
  // Reuse any in-flight token request instead of calling Auth0 twice
  if (!cachedTokenPromise) {
    cachedTokenPromise = tokenFetcher().finally(() => {
      cachedTokenPromise = null; // Clear after resolved
    });
  }
  try {
    return await cachedTokenPromise;
  } catch (err) {
    console.error("Failed to fetch Auth0 token", err);
    return null;
  }
};

instance.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Keep the manual setter just in case for backward compatibility
export const setAuthToken = (token) => {
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete instance.defaults.headers.common['Authorization'];
  }
};

export default instance;
