import { getAuthToken } from "../lib/axios";

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://localhost:8000/api";

async function request(path, options = {}) {
  const token = await getAuthToken();
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    };
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
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
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

export async function fetchArticles({ limit = 30, offset = 0, tag = null } = {}) {
  const cacheKey = `articles-${limit}-${offset}-${tag || "all"}`;
  
  if (articleCache.has(cacheKey)) {
    const { data, timestamp } = articleCache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
  }

  const data = await request("/articles/getall", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, offset, tag }),
  });
  
  const now = Date.now();
  
  // Prime single article cache
  const articles = Array.isArray(data) ? data : (data.articles || []);
  articles.forEach(article => {
    if (article.slug) {
      singleArticleCache.set(article.slug, { data: article, timestamp: now });
    }
  });

  articleCache.set(cacheKey, { data, timestamp: now });
  
  return data;
}

export async function fetchArticleBySlug(slug) {
  if (singleArticleCache.has(slug)) {
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

export function fetchAdjacentArticles(slug) {
  return request(`/articles/adjacent/${slug}`, {
    method: "GET",
  });
}

export function postArticle(formData) {
  return request("/articles/add", {
    method: "POST",
    body: formData,
  });
}

export function deleteArticle(id) {
  return request(`/articles/${id}`, {
    method: "DELETE",
  });
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

export function getCourseDetails(courseId) {
  return request(`/courses/course/${courseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: localStorage.getItem("fined_email") || "" }),
  });
}

export function addCard(payload) {
  return request("/courses/cards/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getCard(courseId, moduleId, cardId) {
  return request(`/courses/course/${courseId}/module/${moduleId}/card/${cardId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: localStorage.getItem("fined_email") || "" }),
  });
}

export function updateCard(courseId, moduleId, cardId, body) {
  return request(`/courses/course/${courseId}/module/${moduleId}/card/${cardId}/updateCard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function fetchAuthors() {
  return request("/authors/");
}

export function fetchAuthorDetails(slug) {
  return request(`/authors/${slug}`);
}

export function joinWaitlist(email) {
  return request("/home/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export { API_BASE_URL };
