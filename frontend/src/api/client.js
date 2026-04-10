const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

export const STORAGE_KEYS = {
  token: "token",
  userRole: "userRole",
  user: "user",
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredToken() {
  if (!isBrowser()) return "";
  return localStorage.getItem(STORAGE_KEYS.token) || "";
}

export function getStoredUser() {
  if (!isBrowser()) return null;

  const rawUser = localStorage.getItem(STORAGE_KEYS.user);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function saveAuthSession(payload) {
  if (!isBrowser() || !payload?.user || !payload?.token) return;

  localStorage.setItem(STORAGE_KEYS.token, payload.token);
  localStorage.setItem(STORAGE_KEYS.userRole, payload.user.role || "");
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(payload.user));
}

export function clearAuthSession() {
  if (!isBrowser()) return;

  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.userRole);
  localStorage.removeItem(STORAGE_KEYS.user);
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(payload.message || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  login(payload) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getCaregiverScenarios() {
    return request("/caregiver/scenarios");
  },
  getCaregiverScenario(scenarioId) {
    return request(`/caregiver/scenarios/${scenarioId}`);
  },
  updateCaregiverScenarioSettings(scenarioId, payload) {
    return request(`/caregiver/scenarios/${scenarioId}/settings`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  getCaregiverScenarioHistory(scenarioId) {
    return request(`/caregiver/scenarios/${scenarioId}/history`);
  },
  getCaregiverSessionAnalytics(sessionId) {
    return request(`/caregiver/sessions/${sessionId}/analytics`);
  },
  getCaregiverAnalytics() {
    return request("/caregiver/analytics");
  },
  getChildScenarios() {
    return request("/child/scenarios");
  },
  startChildSession(payload) {
    return request("/child/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getChildSession(sessionId) {
    return request(`/child/sessions/${sessionId}`);
  },
  sendChildMessage(sessionId, payload) {
    return request(`/child/sessions/${sessionId}/respond`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Backward-compatible aliases for existing imports/usages.
  getScenarios() {
    return this.getCaregiverScenarios();
  },
  getScenario(scenarioId) {
    return this.getCaregiverScenario(scenarioId);
  },
  updateScenario(scenarioId, payload) {
    return this.updateCaregiverScenarioSettings(scenarioId, payload);
  },
  getAnalytics() {
    return this.getCaregiverAnalytics();
  },
  getScenarioHistory(scenarioId) {
    return this.getCaregiverScenarioHistory(scenarioId);
  },
  getSessionAnalytics(sessionId) {
    return this.getCaregiverSessionAnalytics(sessionId);
  },
  startSession(payload) {
    return this.startChildSession(payload);
  },
  getSession(sessionId) {
    return this.getChildSession(sessionId);
  },
  sendMessage(sessionId, payload) {
    return this.sendChildMessage(sessionId, payload);
  },
};
