export function createClient(baseUrl = "/api/v1", fetcher = fetch) {
  async function request(path, { method = "GET", body } = {}, retry = true) {
    let response;
    try {
      response = await fetcher(`${baseUrl.replace(/\/$/, "")}${path}`, {
        method,
        credentials: "include",
        headers:
          body === undefined
            ? { Accept: "application/json" }
            : {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new Error("서버에 연결하지 못했습니다. 연결 상태를 확인해 주세요.");
    }
    const data =
      response.status === 204 ? null : await response.json().catch(() => null);
    if (
      response.status === 401 &&
      data?.error?.code === "TOKEN_EXPIRED" &&
      retry
    ) {
      await request("/auth/refresh", { method: "POST" }, false);
      return request(path, { method, body }, false);
    }
    if (!response.ok) {
      const error = new Error(
        data?.error?.message ||
          `요청을 처리하지 못했습니다 (${response.status}).`,
      );
      error.code = data?.error?.code;
      error.status = response.status;
      throw error;
    }
    return data;
  }
  return {
    notifications: ({ cursor } = {}) =>
      request(
        `/notifications?${new URLSearchParams({ limit: 20, ...(cursor ? { cursor } : {}) })}`,
      ),
    unreadCount: () => request("/notifications/unread-count"),
    readNotification: (id) =>
      request(`/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
      }),
    readAllNotifications: () =>
      request("/notifications/read-all", { method: "POST" }),
    usernameCheck: (username) =>
      request(`/auth/username-check?${new URLSearchParams({ username })}`),
    courses: () => request("/enrollments/courses"),
    enrollments: () => request("/users/me/enrollments"),
    enroll: (proposalId) =>
      request("/enrollments", { method: "POST", body: { proposalId } }),
    cancelEnrollment: (id) =>
      request(`/enrollments/${id}`, { method: "DELETE" }),
    reviewList: () => request("/admin/proposals"),
    reviewDetail: (id) => request(`/admin/proposals/${id}/review`),
    review: (id, body) =>
      body.action === "HOLD"
        ? request(`/admin/proposals/${id}/hold`, {
            method: "POST",
            body: { reason: body.reason },
          })
        : request(`/admin/proposals/${id}/review`, { method: "POST", body }),
    similar: (body) =>
      request("/proposals/similar-check", { method: "POST", body }),
    invite: (id) =>
      request(`/proposals/${id}/co-proposal-invites`, { method: "POST" }),
    me: () => request("/users/me"),
    login: (body) => request("/auth/login", { method: "POST", body }),
    signup: (body) => request("/auth/signup", { method: "POST", body }),
    logout: () => request("/auth/logout", { method: "POST" }),
    list: ({ cursor, ...filters } = {}) =>
      request(
        `/proposals?${new URLSearchParams(Object.entries({ ...filters, limit: 20, ...(cursor ? { cursor } : {}) }).filter(([, v]) => v !== "" && v != null))}`,
      ),
    detail: (id) => request(`/proposals/${id}`),
    create: (body) => request("/proposals", { method: "POST", body }),
    interest: (id, body) =>
      request(`/proposals/${id}/interest`, { method: "PUT", body }),
    cancelInterest: (id) =>
      request(`/proposals/${id}/interest`, { method: "DELETE" }),
    vote: (id) => request(`/proposals/${id}/vote`),
    submitVote: (id, body) =>
      request(`/proposals/${id}/vote`, { method: "PUT", body }),
    result: (id) => request(`/proposals/${id}/vote/result`),
    myInterests: () => request("/users/me/interests"),
    myProposals: () => request("/users/me/proposals"),
  };
}
