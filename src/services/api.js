const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const AUTH_KEY = "cinevault-auth";

export function getToken() {
  return getAuth()?.token || null;
}

export function setAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("cinevault-auth"));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event("cinevault-auth"));
}

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.detail || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  profile: () => request("/api/profile"),

  updateProfile: (payload) =>
    request("/api/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getCollection: (kind) => request(`/api/collections/${kind}`),

  add: (kind, movie) =>
    request(`/api/collections/${kind}`, {
      method: "POST",
      body: JSON.stringify({ movie }),
    }),

  remove: (kind, id) =>
    request(`/api/collections/${kind}/${id}`, {
      method: "DELETE",
    }),

  clear: (kind) =>
    request(`/api/collections/${kind}`, {
      method: "DELETE",
    }),

  importCollections: (payload) =>
    request("/api/import-collections", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
