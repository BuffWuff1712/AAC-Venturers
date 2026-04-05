const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(payload.message || "Request failed");
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
  getScenarios() {
    return request("/caregiver/scenarios");
  },
  getScenario(scenarioId) {
    return request(`/caregiver/scenarios/${scenarioId}`);
  },
  updateScenario(scenarioId, payload) {
    return request(`/caregiver/scenarios/${scenarioId}/settings`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  getAnalytics() {
    return request("/caregiver/analytics");
  },
  getScenarioHistory(scenarioId) {
    return request(`/caregiver/scenarios/${scenarioId}/history`);
  },
  getSessionAnalytics(sessionId) {
    return request(`/caregiver/sessions/${sessionId}/analytics`);
  },
  getChildScenarios() {
    return request("/child/scenarios");
  },
  startSession(payload) {
    return request("/child/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getSession(sessionId) {
    return request(`/child/sessions/${sessionId}`);
  },
  sendMessage(sessionId, payload) {
    return request(`/child/sessions/${sessionId}/respond`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  respondToConversation(payload) {
    return request("/conversation/respond", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
