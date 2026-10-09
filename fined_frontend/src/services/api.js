import { getAuthToken } from "../lib/axios";

const rawBase = (import.meta.env.VITE_API_URL || "http://localhost:8000").trim();
const API_BASE_URL = rawBase.endsWith("/api")
  ? rawBase
  : `${rawBase.replace(/\/+$/, "")}/api`;

async function request(path, options = {}) {
  const fallbackToken = await getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };
  if (fallbackToken && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${fallbackToken}`;
  }
  options.headers = headers;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail = typeof data === "object" ? data.detail || JSON.stringify(data) : data;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return data;
}

const articleCache = new Map();
const singleArticleCache = new Map();
const adjacentArticlesCache = new Map();
const authorProfileCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes cache for instant navigation & reading

const STORAGE_KEY_ARTICLES = "fined_articles_cache_v2";

export function getLocalCachedArticles() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ARTICLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // sessionStorage unavailable
  }
  return null;
}

export function setLocalCachedArticles(articles) {
  try {
    if (Array.isArray(articles) && articles.length > 0) {
      sessionStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(articles));
    }
  } catch {
    // ignore
  }
}

export function getCachedArticle(slug) {
  if (!slug) return null;
  const entry = singleArticleCache.get(slug);
  if (entry && entry.data && entry.data.content) {
    return entry.data;
  }
  try {
    const localArticles = getLocalCachedArticles();
    if (Array.isArray(localArticles)) {
      const found = localArticles.find((a) => a.slug === slug);
      if (found && found.content) {
        singleArticleCache.set(slug, { data: found, timestamp: Date.now() });
        return found;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function clearArticleCache() {
  articleCache.clear();
  singleArticleCache.clear();
  adjacentArticlesCache.clear();
  try {
    sessionStorage.removeItem(STORAGE_KEY_ARTICLES);
  } catch {
    // ignore
  }
}

export async function prefetchArticle(slug) {
  if (!slug || singleArticleCache.has(slug)) return;
  try {
    const data = await request(`/articles/slug/${slug}`, { method: "GET" });
    singleArticleCache.set(slug, { data, timestamp: Date.now() });
  } catch {
    // Ignore prefetch errors silently
  }
}

export async function fetchArticles({ limit = 30, offset = 0, tag = null } = {}) {
  const cacheKey = `articles-${limit}-${offset}-${tag || "all"}`;
  
  if (articleCache.has(cacheKey)) {
    const { data, timestamp } = articleCache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
  }

  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (offset) params.append("offset", offset);
  if (tag) params.append("tag", tag);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  const data = await request(`/articles${queryStr}`, {
    method: "GET",
  });
  
  const now = Date.now();
  
  // Prime single article cache only if content is present
  const articles = Array.isArray(data) ? data : (data.articles || []);
  articles.forEach(article => {
    if (article.slug && article.content) {
      singleArticleCache.set(article.slug, { data: article, timestamp: now });
    }
  });

  articleCache.set(cacheKey, { data, timestamp: now });
  if (offset === 0 && (!tag || tag === "all")) {
    setLocalCachedArticles(articles);
  }
  
  return data;
}

export async function fetchArticleBySlug(slug, { force = false } = {}) {
  if (!force && singleArticleCache.has(slug)) {
    const { data, timestamp } = singleArticleCache.get(slug);
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
  }

  const data = await request(`/articles/slug/${slug}`, {
    method: "GET",
  });
  
  singleArticleCache.set(slug, { data, timestamp: Date.now() });
  return data;
}

export async function fetchAdjacentArticles(slug) {
  if (adjacentArticlesCache.has(slug)) {
    const { data, timestamp } = adjacentArticlesCache.get(slug);
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
  }

  const data = await request(`/articles/adjacent/${slug}`, {
    method: "GET",
  });
  adjacentArticlesCache.set(slug, { data, timestamp: Date.now() });
  return data;
}

export async function fetchRelatedArticles(slug, limit = 3) {
  try {
    return await request(`/articles/related/${slug}?limit=${limit}`, {
      method: "GET",
    });
  } catch (err) {
    console.warn("Failed to fetch related articles, falling back to general list:", err);
    try {
      const data = await fetchArticles({ limit: 6 });
      const articles = Array.isArray(data) ? data : (data.articles || []);
      return articles.filter(a => a.slug !== slug).slice(0, limit);
    } catch {
      return [];
    }
  }
}

export async function postArticle(formData) {
  const result = await request("/articles/add", {
    method: "POST",
    body: formData,
  });
  clearArticleCache();
  return result;
}

export function fetchAdminArticles({ limit = 50, offset = 0, status = "all" } = {}) {
  const query = new URLSearchParams();
  if (limit) query.append("limit", limit);
  if (offset) query.append("offset", offset);
  if (status && status !== "all") query.append("status_filter", status);
  return request(`/articles/admin/all?${query.toString()}`, {
    method: "GET",
  });
}

export function uploadArticleImage(formData) {
  return request("/articles/upload-image", {
    method: "POST",
    body: formData,
  });
}

export async function deleteArticle(id) {
  const result = await request(`/articles/${id}`, {
    method: "DELETE",
  });
  clearArticleCache();
  return result;
}

export function sendNewsletter(data) {
  return request("/admin/newsletters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
}

export function sendContactQuery(name, email, message) {
  return request("/contact/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });
}

export function sendFeedback(form) {
  return request("/home/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form }),
  });
}

export function getCourses() {
  return request("/courses/getall", {
    method: "GET",
  });
}

export function getCourseDetails(courseId, email) {
  return request(`/courses/course/${courseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email || "" }),
  });
}

export function addCard(payload) {
  return request("/courses/cards/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ── Admin course authoring (draft courses only; the backend enforces it) ──

export function editCard(cardId, changes) {
  return request(`/courses/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
}

export function deleteCard(cardId) {
  return request(`/cards/${cardId}`, { method: "DELETE" });
}

export function getModuleCards(moduleId) {
  return request(`/cards/${moduleId}/getall`, { method: "GET" });
}

export function getCourseModules(courseId) {
  return request(`/modules/course/${courseId}`, { method: "GET" });
}

export function getAdminCourses() {
  return request("/courses/admin/all", { method: "GET" });
}

// Admin-only list of content sources: the links behind facts and numbers in
// course content (backend routes/sources.py). Learners never see these.
export function getSources(moduleId) {
  const query = moduleId ? `?module_id=${encodeURIComponent(moduleId)}` : "";
  return request(`/sources${query}`, { method: "GET" });
}

export function addSource(source) {
  return request("/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(source),
  });
}

export function editSource(sourceId, changes) {
  return request(`/sources/${sourceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
}

export function deleteSource(sourceId) {
  return request(`/sources/${sourceId}`, { method: "DELETE" });
}

export function getModuleBundle(courseId, moduleId, email) {
  return request(`/courses/course/${courseId}/module/${moduleId}/bundle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email || "" }),
  });
}

export function getCard(courseId, moduleId, cardId, email) {
  return request(`/courses/course/${courseId}/module/${moduleId}/card/${cardId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email || "" }),
  });
}

export function updateCard(courseId, moduleId, cardId, body) {
  return request(`/courses/course/${courseId}/module/${moduleId}/card/${cardId}/updateCard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getBundleByCardSlug(cardSlug, email) {
  return request(`/courses/card/${cardSlug}/bundle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email || "" }),
  });
}

// Newsletter sign-up (signed-in users; saved against their account).
export function saveNewsletterEmail(email, enteredEmail) {
  return request("/articles/saveemail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, enteredEmail }),
  });
}

// Public: Module 1 of the stock-market course, for visitors who aren't signed in.
export function getSampleModule() {
  return request("/courses/sample-module", { method: "GET" });
}

export function updateCardBySlug(cardSlug, body) {
  return request(`/courses/card/${cardSlug}/updateCard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function fetchAuthors() {
  return request("/authors/");
}

export async function fetchAuthorDetails(slug, { limit = 12, offset = 0 } = {}) {
  const cacheKey = `author-${slug}-${limit}-${offset}`;
  if (authorProfileCache.has(cacheKey)) {
    const { data, timestamp } = authorProfileCache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
  }

  const data = await request(`/authors/${slug}?limit=${limit}&offset=${offset}`);
  authorProfileCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}


export function joinWaitlist(email) {
  return request("/home/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function fetchPersonalLens(articleId, answers) {
  return request("/personal-lens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      article_id: articleId,
      answers: answers
    }),
  });
}

export function fetchArticleQuestions(articleId) {
  return request(`/personal-lens/questions/${articleId}`, {
    method: "GET",
  });
}

export function fetchArticleIndexExport() {
  return request("/admin/article-index-export", {
    method: "GET",
  });
}

const leaderboardCache = new Map();
const LEADERBOARD_CACHE_TTL_MS = 1000 * 60 * 3; // 3 minutes

export async function getLeaderboard(timeframe = "all_time", { force = false } = {}) {
  const cacheKey = `leaderboard_${timeframe}`;
  if (!force && leaderboardCache.has(cacheKey)) {
    const { data, timestamp } = leaderboardCache.get(cacheKey);
    if (Date.now() - timestamp < LEADERBOARD_CACHE_TTL_MS) {
      return data;
    }
  }

  try {
    const data = await request(`/home/leaderboard?timeframe=${timeframe}`, {
      method: "GET",
    });
    if (data && Array.isArray(data)) {
      leaderboardCache.set(cacheKey, { data, timestamp: Date.now() });
    }
    return data;
  } catch (err) {
    console.warn("Failed to fetch leaderboard from API, fallback to default rankings:", err);
    if (leaderboardCache.has(cacheKey)) {
      return leaderboardCache.get(cacheKey).data;
    }
    return null;
  }
}

export function notifyRewardInterest(email) {
  return request("/home/rewards/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function claimEarnStars(action, stars, email) {
  return request("/home/earn-finstars", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, stars, email }),
  });
}

export function getUserProfile(token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return request("/v1/users/me", {
    method: "GET",
    headers,
  });
}

export function updateUserProfile(payload, token) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return request("/v1/users/me", {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
}

export const fetchUserProfile = getUserProfile;

export { API_BASE_URL };


