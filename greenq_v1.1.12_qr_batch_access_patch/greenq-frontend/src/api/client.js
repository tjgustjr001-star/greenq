import { clearCurrentUser, getCurrentUser } from "../utils/auth.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function buildUrl(path, params) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return API_BASE_URL.startsWith("http") ? url.toString() : url.pathname + url.search;
}

function authHeaders(path) {
  if (path.startsWith("/auth/login") || path.startsWith("/health")) return {};
  const user = getCurrentUser();
  if (!user?.loginId) return {};
  return {
    "X-GreenQ-User-Id": String(user.userId || user.id || ""),
    "X-GreenQ-Login-Id": user.loginId,
    "X-GreenQ-Role": user.roleCode || user.role || "",
  };
}

async function request(path, options = {}) {
  const { params, body, ...rest } = options;
  const response = await fetch(buildUrl(path, params), {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(path),
      ...(rest.headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...rest,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || payload || `API 요청 실패: ${response.status}`;
    if (response.status === 401 && !path.startsWith("/auth/login")) {
      clearCurrentUser();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    throw new Error(message);
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    if (!payload.success) throw new Error(payload.message || "요청 처리에 실패했습니다.");
    return payload.data;
  }

  return payload;
}

export const apiClient = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};
