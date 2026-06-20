const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function request(path, options = {}) {
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

export function fetchArticles({ limit = 30, offset = 0 } = {}) {
  return request("/articles/getall", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit, offset }),
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


export { API_BASE_URL };

