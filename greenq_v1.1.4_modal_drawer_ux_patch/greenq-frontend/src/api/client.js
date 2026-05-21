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

async function request(path, options = {}) {
  const { params, body, ...rest } = options;
  const response = await fetch(buildUrl(path, params), {
    headers: {
      "Content-Type": "application/json",
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
