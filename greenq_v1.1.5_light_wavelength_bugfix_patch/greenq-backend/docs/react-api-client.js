const API_BASE_URL = "http://localhost:8081/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.message || "API 요청 실패");
  }
  return json.data;
}

export const greenqApi = {
  login: (loginId, password) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ loginId, password }),
  }),

  getDashboard: () => request("/dashboard"),
  getUsers: () => request("/users"),
  getMeasurementItems: () => request("/measurement-items"),

  getCrops: () => request("/crops"),
  getCrop: (cropId) => request(`/crops/${cropId}`),
  createCrop: (payload) => request("/crops", { method: "POST", body: JSON.stringify(payload) }),
  updateCrop: (cropId, payload) => request(`/crops/${cropId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCrop: (cropId) => request(`/crops/${cropId}`, { method: "DELETE" }),

  getZones: () => request("/zones"),
  getZone: (zoneId) => request(`/zones/${zoneId}`),
  createZone: (payload) => request("/zones", { method: "POST", body: JSON.stringify(payload) }),
  updateZone: (zoneId, payload) => request(`/zones/${zoneId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteZone: (zoneId) => request(`/zones/${zoneId}`, { method: "DELETE" }),

  getBatches: () => request("/batches"),
  getBatch: (batchId) => request(`/batches/${batchId}`),
  createBatch: (payload) => request("/batches", { method: "POST", body: JSON.stringify(payload) }),
  updateBatch: (batchId, payload) => request(`/batches/${batchId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteBatch: (batchId) => request(`/batches/${batchId}`, { method: "DELETE" }),

  getEnvironmentLogs: () => request("/environment-logs"),
  getEnvironmentLog: (envLogId) => request(`/environment-logs/${envLogId}`),

  getIssues: () => request("/issues"),
  getIssue: (issueId) => request(`/issues/${issueId}`),
  getEnvironmentIssueActions: (envNcId) => request(`/issues/env/${envNcId}/actions`),
  addEnvironmentIssueAction: (envNcId, payload) => request(`/issues/env/${envNcId}/actions`, {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  getMeasurements: () => request("/measurements"),
  getMeasurement: (measurementId) => request(`/measurements/${measurementId}`),
  createMeasurement: (payload) => request("/measurements", { method: "POST", body: JSON.stringify(payload) }),

  getReports: () => request("/reports"),
  getReport: (reportId) => request(`/reports/${reportId}`),
  createReport: (payload) => request("/reports", { method: "POST", body: JSON.stringify(payload) }),
};
