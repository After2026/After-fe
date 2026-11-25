const weekdays = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

function normalizeSlot(slot) {
  return {
    ...slot,
    id: slot.timeSlotId ?? slot.id,
    day: slot.day ?? weekdays[slot.dayOfWeek - 1] ?? slot.label,
  };
}

function normalizeProposal(proposal) {
  return {
    ...proposal,
    description: proposal.description ?? proposal.reason,
    activityPlan: proposal.activityPlan ?? proposal.content,
    capacity: proposal.capacity ?? proposal.desiredCapacity,
    proposerId: proposal.proposerId ?? proposal.proposer?.id,
    proposerName: proposal.proposerName ?? proposal.proposer?.displayName,
    recommendedTeacher: proposal.recommendedTeacher ?? proposal.instructorName,
    instructorName: proposal.instructorName ?? proposal.confirmation?.instructorName ?? proposal.advisor?.name,
    referenceUrl: proposal.referenceUrl ?? proposal.referenceLinks?.[0],
    courseTime: proposal.courseTime ?? proposal.schedule?.label,
    voteDeadline: proposal.voteDeadline ?? proposal.voteEndAt,
    surveyDeadline: proposal.surveyDeadline ?? proposal.surveyEndAt,
    requiresInterest: proposal.requiresInterest ??
      !(proposal.advisorId != null && proposal.voteStartAt && !proposal.surveyEndAt),
  };
}

function normalizePage(page) {
  return { ...page, items: page.items.map(normalizeProposal) };
}

function proposalBody(proposal, semesterId) {
  const reference = proposal.referenceUrl.trim();
  return {
    semesterId,
    title: proposal.title,
    category: proposal.category,
    reason: proposal.description,
    content: proposal.activityPlan.trim(),
    targetGrades: proposal.targetGrades,
    desiredCapacity: proposal.capacity,
    instructorType: proposal.instructorType,
    recommendedTeacher: proposal.instructorName.trim() || null,
    equipment: proposal.equipment,
    referenceLinks: [...(reference ? [reference] : []), ...(proposal.referenceLinks?.slice(1) ?? [])],
  };
}

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
      error.details = data?.error?.details;
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
    courses: () => request("/enrollments/courses").then(normalizePage),
    enrollments: () => request("/users/me/enrollments"),
    enroll: (proposalId) =>
      request("/enrollments", { method: "POST", body: { proposalId } }),
    cancelEnrollment: (id) =>
      request(`/enrollments/${id}`, { method: "DELETE" }),
    similar: (body) =>
      request("/proposals/similar-check", { method: "POST", body }),
    me: async () => {
      const user = await request("/users/me");
      return { ...user, classNumber: user.classNumber ?? user.classNo };
    },
    login: (body) => request("/auth/login", { method: "POST", body }),
    signup: (body) => request("/auth/signup", { method: "POST", body }),
    logout: () => request("/auth/logout", { method: "POST" }),
    list: ({ cursor, ...filters } = {}) =>
      request(
        `/proposals?${new URLSearchParams(Object.entries({ ...filters, limit: 20, ...(cursor ? { cursor } : {}) }).filter(([, v]) => v !== "" && v != null))}`,
      ).then(normalizePage),
    detail: (id) => request(`/proposals/${id}`).then(normalizeProposal),
    create: async (draft) => {
      const semester = await request("/semesters/current");
      return request("/proposals", {
        method: "POST",
        body: {
          ...proposalBody(draft, semester.id),
          ...(draft.publishForSurvey ? { publishForSurvey: true } : {}),
        },
      }).then(normalizeProposal);
    },
    updateProposal: (id, proposal) =>
      request(`/proposals/${id}`, {
        method: "PUT",
        body: proposalBody(proposal, proposal.semesterId),
      }).then(normalizeProposal),
    deleteProposal: (id) => request(`/proposals/${id}`, { method: "DELETE" }),
    submitProposal: (id) =>
      request(`/proposals/${id}/submit`, { method: "POST" }).then(normalizeProposal),
    teacherProposals: ({ cursor } = {}) =>
      request(
        `/teacher/proposals?${new URLSearchParams({ limit: 20, ...(cursor ? { cursor } : {}) })}`,
      ).then(normalizePage),
    timeSlots: async () => {
      const { items } = await request("/time-slots");
      return { items: items.map(normalizeSlot) };
    },
    acceptProposal: (id, body) =>
      request(`/teacher/proposals/${id}/accept`, { method: "POST", body }).then(normalizeProposal),
    closeProposalVote: (id) =>
      request(`/teacher/proposals/${id}/close-vote`, { method: "POST" }).then(normalizeProposal),
    confirmProposal: (id, body) =>
      request(`/teacher/proposals/${id}/confirm`, { method: "POST", body }).then(normalizeProposal),
    interest: (id, body) =>
      request(`/proposals/${id}/interest`, { method: "PUT", body }),
    cancelInterest: (id) =>
      request(`/proposals/${id}/interest`, { method: "DELETE" }),
    votableProposals: ({ cursor } = {}) =>
      request(
        `/proposals/votable${cursor ? `?${new URLSearchParams({ cursor })}` : ""}`,
      ).then(normalizePage),
    vote: async (id) => {
      const vote = await request(`/proposals/${id}/vote`);
      return {
        ...vote,
        deadline: vote.voteEndAt ?? vote.deadline,
        slots: (vote.items ?? vote.slots).map(normalizeSlot),
        responses: (vote.myResponses ?? vote.responses ?? []).map((response) => ({
          slotId: response.timeSlotId ?? response.slotId,
          availability: response.availability,
        })),
      };
    },
    submitVote: (id, body) =>
      request(`/proposals/${id}/vote`, {
        method: "PUT",
        body: {
          responses: body.responses.map(({ slotId, timeSlotId, availability }) => ({
            timeSlotId: timeSlotId ?? slotId,
            availability,
          })),
        },
      }),
    result: async (id) => {
      const result = await request(`/proposals/${id}/vote/result`);
      const slots = (result.items ?? result.slots).map(normalizeSlot);
      return {
        ...result,
        slots,
        totalRespondents: result.totalRespondents ?? slots[0]?.totalVoters ?? 0,
      };
    },
    myInterests: async () => {
      const page = await request("/users/me/interests");
      return {
        ...page,
        items: page.items.map((item) => normalizeProposal(
          item.proposal ? { ...item.proposal, myInterest: item.interest } : item,
        )),
      };
    },
    myProposals: () => request("/users/me/proposals").then(normalizePage),
  };
}
