import { apiClient } from "./client.js";

export const greenqApi = {
  health: () => apiClient.get("/health"),
  login: (data) => apiClient.post("/auth/login", data),
  dashboard: () => apiClient.get("/dashboard"),
  users: () => apiClient.get("/users"),
  measurementItems: () => apiClient.get("/measurement-items"),

  crops: () => apiClient.get("/crops"),
  crop: (id) => apiClient.get(`/crops/${id}`),
  cropStandards: (cropId, type) => apiClient.get(`/crops/${cropId}/standards/${type}`),
  saveCropStandards: (cropId, type, data) => apiClient.put(`/crops/${cropId}/standards/${type}`, data),
  createCrop: (data) => apiClient.post("/crops", data),
  updateCrop: (id, data) => apiClient.put(`/crops/${id}`, data),
  deleteCrop: (id) => apiClient.delete(`/crops/${id}`),

  zones: () => apiClient.get("/zones"),
  zone: (id) => apiClient.get(`/zones/${id}`),
  createZone: (data) => apiClient.post("/zones", data),
  updateZone: (id, data) => apiClient.put(`/zones/${id}`, data),
  deleteZone: (id) => apiClient.delete(`/zones/${id}`),

  batches: () => apiClient.get("/batches"),
  batch: (id) => apiClient.get(`/batches/${id}`),
  createBatch: (data) => apiClient.post("/batches", data),
  updateBatch: (id, data) => apiClient.put(`/batches/${id}`, data),
  deleteBatch: (id) => apiClient.delete(`/batches/${id}`),

  environmentLogs: (params) => apiClient.get("/environment-logs", params),
  environmentLog: (id) => apiClient.get(`/environment-logs/${id}`),
  createEnvironmentLog: (data) => apiClient.post("/environment-logs", data),
  deleteEnvironmentLog: (id) => apiClient.delete(`/environment-logs/${id}`),
  runEnvironmentSimulator: (data) => apiClient.post("/environment-simulator/run", data),

  issues: () => apiClient.get("/issues"),
  envIssueAlerts: () => apiClient.get("/issues/env/alerts"),
  issue: (id) => apiClient.get(`/issues/${id}`),
  issueActions: (envNcId) => apiClient.get(`/issues/env/${envNcId}/actions`),
  createIssueAction: (envNcId, data) => apiClient.post(`/issues/env/${envNcId}/actions`, data),
  deleteIssue: (issueType, rawId) => apiClient.delete(`/issues/${issueType}/${rawId}`),

  measurements: () => apiClient.get("/measurements"),
  measurement: (id) => apiClient.get(`/measurements/${id}`),
  createMeasurement: (data) => apiClient.post("/measurements", data),
  deleteMeasurement: (id) => apiClient.delete(`/measurements/${id}`),

  deletedData: () => apiClient.get("/deleted-data"),
  restoreDeletedData: (entityName, idValue) => apiClient.put(`/deleted-data/${entityName}/${idValue}/restore`, {}),
  permanentDeleteDeletedData: (entityName, idValue) => apiClient.delete(`/deleted-data/${entityName}/${idValue}`),

  reports: () => apiClient.get("/reports"),
  report: (id) => apiClient.get(`/reports/${id}`),
  createReport: (data) => apiClient.post("/reports", data),
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
};
