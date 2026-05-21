const USER_KEY = "greenqUser";

export const ROLE = {
  ADMIN: "ADMIN",
  WORKER: "WORKER",
};

export const ROLE_HOME = {
  ADMIN: "/dashboard",
  WORKER: "/worker",
};

const PUBLIC_PATHS = ["/login"];

const ADMIN_ONLY_PREFIXES = [
  "/dashboard",
  "/crops",
  "/zones",
  "/batches",
  "/reports",
  "/users",
  "/deleted-data",
  "/trash",
];

const WORKER_ONLY_PREFIXES = ["/worker"];

const SHARED_PREFIXES = [
  "/environment",
  "/quality",
  "/issues",
  "/scan",
];

function safeJsonParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeRole(value) {
  const role = String(value || "").trim().toUpperCase();
  return role === ROLE.ADMIN ? ROLE.ADMIN : ROLE.WORKER;
}

export function normalizeUser(user = {}) {
  if (!user || typeof user !== "object") return {};
  const roleCode = normalizeRole(user.roleCode || user.role);
  return {
    ...user,
    userId: user.userId || user.id || null,
    id: user.userId || user.id || null,
    userName: user.userName || user.name || "",
    name: user.userName || user.name || "",
    roleCode,
    role: roleCode,
    loginId: user.loginId || "",
    accountStatus: user.accountStatus || "ACTIVE",
  };
}

export function getCurrentUser() {
  const user = normalizeUser(safeJsonParse(localStorage.getItem(USER_KEY)) || {});
  if (!user.loginId || !user.roleCode) return {};
  return user;
}

export function getCurrentRole() {
  return getCurrentUser().roleCode || "";
}

export function isAdmin(user = getCurrentUser()) {
  return normalizeRole(user.roleCode || user.role) === ROLE.ADMIN;
}

export function isWorker(user = getCurrentUser()) {
  return normalizeRole(user.roleCode || user.role) === ROLE.WORKER;
}

export function isValidCurrentUser() {
  const user = getCurrentUser();
  return Boolean(user.loginId && user.roleCode && user.accountStatus === "ACTIVE");
}

export function hasLogin() {
  return isValidCurrentUser();
}

export function saveCurrentUser(user) {
  const normalized = normalizeUser(user);
  localStorage.setItem(USER_KEY, JSON.stringify({
    ...normalized,
    loginAt: new Date().toISOString(),
  }));
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
}

function startsWithAny(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function defaultPathForRole(roleValue) {
  const role = normalizeRole(roleValue);
  return ROLE_HOME[role] || "/login";
}

export function canAccessPath(pathname, user = getCurrentUser()) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (!user || !user.loginId) return false;

  const role = normalizeRole(user.roleCode || user.role);

  if (role === ROLE.ADMIN) {
    return !startsWithAny(pathname, WORKER_ONLY_PREFIXES);
  }

  if (startsWithAny(pathname, ADMIN_ONLY_PREFIXES)) return false;
  if (startsWithAny(pathname, WORKER_ONLY_PREFIXES)) return true;
  if (startsWithAny(pathname, SHARED_PREFIXES)) return true;

  return false;
}
