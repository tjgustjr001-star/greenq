const USER_KEY = "greenqUser";

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "{}");
  } catch {
    return {};
  }
}

export function hasLogin() {
  return Boolean(localStorage.getItem(USER_KEY));
}

export function saveCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify({ ...user, name: user.userName, role: user.roleCode }));
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
}
