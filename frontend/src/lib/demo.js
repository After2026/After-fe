import { isEnrollmentOpen } from "./enrollmentSchedule.js";

const KEY = "after.voting.v1";
const SESSION_KEY = "after.demo.session";
const confirmedCourseStatuses = ["CONFIRMED", "ENROLLING"];
const schoolTimeSlots = [
  {
    id: 1,
    timeSlotId: 1,
    day: "월요일",
    dayOfWeek: "MONDAY",
    period: 8,
    endPeriod: 10,
    label: "월요일 8교시~10교시",
  },
  {
    id: 2,
    timeSlotId: 2,
    day: "수요일",
    dayOfWeek: "WEDNESDAY",
    period: 8,
    endPeriod: 10,
    label: "수요일 8교시~10교시",
  },
];
const sampleCourseDetails = {
  4: { instructorName: "최민서", courseTime: "매주 화요일 16:00–17:00" },
  5: { instructorName: "윤서진", courseTime: "매주 수요일 16:00–17:00" },
  6: { instructorName: "한수빈", courseTime: "매주 목요일 16:00–17:00" },
};
const backendCourseDescription =
  "서버와 데이터베이스의 기초를 배우고, 간단한 웹 API를 직접 만들어 봐요.";
export const availability = {
  AVAILABLE: "가능",
  ADJUSTABLE: "조정 가능",
  UNAVAILABLE: "불가능",
};
const deadline = () => new Date(Date.now() + 7 * 86400000).toISOString();
export function seed() {
  return {
    proposals: [
      {
        id: 1,
        title: "파이썬으로 디스코드 봇 만들기",
        category: "IT",
        description:
          "기초 문법부터 웹 서비스 제작까지, 함께 배우며 작은 프로젝트를 완성해요.",
        targetGrades: [1, 2, 3],
        status: "SURVEYING",
        interestCount: 18,
        threshold: 25,
        surveyDeadline: deadline(),
        proposerName: "김하늘",
        icon: "⌘",
      },
      {
        id: 2,
        title: "현직 개발자와 포트폴리오 리뷰",
        category: "ARTS_PE",
        description:
          "기본기 훈련과 팀 경기를 통해 농구를 즐겨요. 초보자도 환영합니다.",
        targetGrades: [1, 2, 3],
        status: "VOTING",
        interestCount: 32,
        threshold: 20,
        voteDeadline: deadline(),
        proposerName: "이도윤",
        icon: "◉",
        slots: [
          { id: 1, day: "월요일", period: 8 },
          { id: 2, day: "수요일", period: 8 },
        ],
      },
      {
        id: 3,
        title: "아카펠라 발성 앙상블",
        category: "SUBJECT",
        description:
          "좋아하는 영화 장면으로 실생활 영어 표현을 배우고 대화해요.",
        targetGrades: [1, 2],
        status: "SURVEYING",
        interestCount: 12,
        threshold: 20,
        surveyDeadline: deadline(),
        proposerName: "박서연",
        icon: "▶",
      },
      {
        id: 4,
        title: "백엔드 입문 과정",
        category: "CAREER",
        description: backendCourseDescription,
        ...sampleCourseDetails[4],
        targetGrades: [1, 2, 3],
        status: "ENROLLING",
        interestCount: 28,
        threshold: 20,
        proposerName: "정지우",
        icon: "✳",
      },
      {
        id: 5,
        title: "3D 프린팅으로 생활용품 만들기",
        category: "IT",
        description:
          "모델링 기초를 배우고 나만의 생활용품을 제작하는 수업입니다.",
        ...sampleCourseDetails[5],
        targetGrades: [1, 2],
        status: "ENROLLING",
        interestCount: 15,
        threshold: 20,
        proposerName: "이민준",
        icon: "⌘",
      },
      {
        id: 6,
        title: "실험으로 배우는 화학 1",
        category: "SUBJECT",
        description: "안전한 실험을 통해 화학의 기초 원리를 탐구합니다.",
        ...sampleCourseDetails[6],
        targetGrades: [2, 3],
        status: "CONFIRMED",
        interestCount: 9,
        threshold: 15,
        proposerName: "박지민",
        icon: "▤",
      },
      {
        id: 7,
        title: "영어 원서로 읽는 과학 탐험",
        category: "SUBJECT",
        description: "흥미로운 과학 이야기를 영어 원서로 함께 읽어요.",
        targetGrades: [1, 2],
        status: "SURVEYING",
        interestCount: 4,
        threshold: 20,
        surveyDeadline: deadline(),
        proposerName: "김도현",
        icon: "▤",
      },
      {
        id: 8,
        title: "생활 속 데이터를 읽는 법",
        category: "IT",
        description: "학교생활에서 궁금한 점을 정하고, 모은 데이터를 그래프로 표현해요.",
        targetGrades: [1, 2, 3],
        status: "SUBMITTED",
        interestCount: 0,
        instructorType: "INTERNAL",
        proposerName: "이하은",
      },
    ],
    interests: { 2: { intentLevel: 2, comment: "" } },
    votes: {},
    interestCountsExcludeProposer: true,
  };
}
export function createDemo(
  storage = localStorage,
  session = typeof sessionStorage === "undefined" ? storage : sessionStorage,
  { enrollmentWindow = null, now = Date.now } = {},
) {
  function requireEnrollmentOpen() {
    if (!isEnrollmentOpen(enrollmentWindow, now())) {
      throw new Error("수강신청 기간에만 신청하거나 취소할 수 있습니다.");
    }
  }

  function load() {
    const raw = storage.getItem(KEY);
    if (!raw) return seed();
    try {
      const s = JSON.parse(raw);
      if (!Array.isArray(s.proposals) || !s.interests || !s.votes)
        throw Error();
      for (const proposal of s.proposals) {
        const submittedSample = proposal.id === 8 && proposal.proposerName === "이하은";
        if (!s.interestCountsExcludeProposer && (isStudentProposal(proposal) || submittedSample)) {
          proposal.interestCount = Math.max(0, (proposal.interestCount ?? 0) - 1);
        }
        const details = sampleCourseDetails[proposal.id];
        if (!details) continue;
        proposal.instructorName ??= details.instructorName;
        proposal.courseTime ??= details.courseTime;
        if (
          proposal.id === 4 &&
          proposal.description ===
            "다양한 디자인 분야를 탐색하고 나만의 포트폴리오를 만들어 봐요."
        ) {
          proposal.description = backendCourseDescription;
        }
      }
      s.interestCountsExcludeProposer = true;
      // Older demo saves included a Friday candidate on the sample poll.
      const samplePoll = s.proposals.find(({ id }) => id === 2);
      if (
        samplePoll?.slots?.some(({ id, day }) => id === 3 && day === "금요일")
      ) {
        samplePoll.slots = samplePoll.slots.filter(({ id }) => id !== 3);
        if (Array.isArray(s.votes[2])) {
          s.votes[2] = s.votes[2].filter(({ slotId }) => slotId !== 3);
        }
      }
      return s;
    } catch {
      throw new Error(
        "체험 데이터를 읽지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
      );
    }
  }
  function save(s) {
    storage.setItem(KEY, JSON.stringify(s));
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("after:data-change"));
  }
  function find(s, id, { includeWithdrawn = false } = {}) {
    const p = s.proposals.find(
      (p) => p.id === Number(id) && (includeWithdrawn || !p.withdrawnByAuthor),
    );
    if (!p) {
      const error = new Error("제안을 찾을 수 없습니다.");
      error.status = 404;
      throw error;
    }
    return p;
  }
  const user = {
    id: 1,
    name: "김학생",
    grade: 1,
    role: "STUDENT",
    status: "ACTIVE",
  };
  const teacher = { id: 2, name: "이서진", role: "TEACHER", status: "ACTIVE" };

  function currentUser() {
    const activeSession = session.getItem(SESSION_KEY);
    if (activeSession === "teacher") return teacher;
    if (activeSession === "active") return user;
    return null;
  }

  function requireUser() {
    const current = currentUser();
    if (!current) {
      const error = new Error("로그인이 필요합니다.");
      error.status = 401;
      throw error;
    }
    return current;
  }

  function requireRole(role) {
    const current = requireUser();
    if (current.role !== role) {
      const error = new Error("이 작업을 수행할 권한이 없습니다.");
      error.status = 403;
      throw error;
    }
    return current;
  }

  function page(items, cursor) {
    const start = Number(cursor || 0);
    return {
      items: items.slice(start, start + 20),
      nextCursor: items.length > start + 20 ? String(start + 20) : null,
    };
  }

  function isStudentProposal(proposal) {
    return proposal.proposerId == null
      ? proposal.proposerName === user.name
      : proposal.proposerId === user.id;
  }

  function requireProposalOwner(proposal) {
    if (isStudentProposal(proposal)) return;
    const error = new Error("제안자만 처리할 수 있습니다.");
    error.status = 403;
    throw error;
  }

  function editableProposal(proposal) {
    return ["DRAFT", "SUBMITTED", "SURVEYING"].includes(proposal.status) &&
      !proposal.voteEndAt && !proposal.voteDeadline;
  }

  function surveyOpen(proposal) {
    return proposal.status === "SURVEYING" &&
      (proposal.awaitingTeacher || Date.parse(proposal.surveyDeadline) > now());
  }

  function voteInfo(s, p) {
    const requiresInterest = p.responsibleTeacherId == null;
    const voter = currentUser() ?? (requiresInterest ? user : null);
    return {
      slots: p.slots || [],
      deadline: p.voteDeadline,
      requiresInterest,
      canVote:
        p.status === "VOTING" &&
        Date.parse(p.voteDeadline) > now() &&
        voter?.role === "STUDENT" &&
        p.targetGrades.includes(voter.grade) &&
        (!requiresInterest || [1, 2].includes(s.interests[p.id]?.intentLevel)),
      responses: s.votes[p.id] || [],
    };
  }
  function syncNotifications() {
    const s = load();
    s.notifications ||= [];
    s.notifiedOpenings ||= {};
    for (const p of s.proposals) {
      if (
        (s.interests[p.id] ||
          (p.responsibleTeacherId != null &&
            (isStudentProposal(p) || s.votes[p.id]?.length))) &&
        ["CONFIRMED", "ENROLLING", "RUNNING"].includes(p.status) &&
        !s.notifiedOpenings[p.id]
      ) {
        s.notifications.unshift({
          id: `course-open-${p.id}`,
          proposalId: p.id,
          title: s.interests[p.id]
            ? "관심 수업이 개설되었습니다"
            : "수업 개설이 확정되었습니다",
          message: `${p.title} 수업이 개설되었습니다. 수강신청 상태를 확인해 주세요.`,
          read: false,
          createdAt: new Date(now()).toISOString(),
        });
        s.notifiedOpenings[p.id] = true;
      }
    }
    // Avoid emitting another refresh event while an alert refresh is running.
    storage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  return {
    notifications: async ({ cursor } = {}) =>
      page(
        currentUser()?.role === "TEACHER" ? [] : syncNotifications().notifications,
        cursor,
      ),
    unreadCount: async () => ({
      count:
        currentUser()?.role === "TEACHER"
          ? 0
          : syncNotifications().notifications.filter((n) => !n.read).length,
    }),
    readNotification: async (id) => {
      if (currentUser()?.role === "TEACHER") return;
      const s = syncNotifications(),
        n = s.notifications.find((n) => String(n.id) === String(id));
      if (n) n.read = true;
      save(s);
    },
    readAllNotifications: async () => {
      if (currentUser()?.role === "TEACHER") return;
      const s = syncNotifications();
      s.notifications.forEach((n) => (n.read = true));
      save(s);
    },
    usernameCheck: async (username) => ({ available: username !== "junho07" }),
    signup: async () => {
      throw new Error(
        "체험 모드에서는 가입 신청을 서버에 전송하지 않습니다. 실제 API 모드에서 이용해 주세요.",
      );
    },
    courses: async () => {
      const s = load();
      const open = isEnrollmentOpen(enrollmentWindow, now());
      return {
        items: s.proposals
          .filter((p) => confirmedCourseStatuses.includes(p.status))
          .map((p) => {
            const capacity = p.capacity || 20;
            const enrollmentCount =
              (p.enrollmentCount ?? 9) +
              (s.enrollments || []).filter((e) => e.proposalId === p.id).length;
            return {
              ...p,
              capacity,
              enrollmentCount,
              canEnroll: open && enrollmentCount < capacity,
              enrollmentDeadline: enrollmentWindow
                ? new Date(enrollmentWindow.endsAt).toISOString()
                : p.enrollmentDeadline,
            };
          }),
      };
    },
    enrollments: async () => ({ items: load().enrollments || [] }),
    enroll: async (proposalId) => {
      requireEnrollmentOpen();
      const s = load(),
        p = find(s, proposalId);
      if (!confirmedCourseStatuses.includes(p.status))
        throw new Error("수강신청 가능한 수업이 아닙니다.");
      s.enrollments ||= [];
      if (
        (p.enrollmentCount ?? 9) +
          s.enrollments.filter((e) => e.proposalId === p.id).length >=
        (p.capacity || 20)
      )
        throw new Error("정원이 마감되었습니다.");
      if (s.enrollments.some((e) => e.proposalId === Number(proposalId)))
        throw new Error("이미 신청한 수업입니다.");
      if (s.enrollments.length >= 2)
        throw new Error("최대 2개 수업까지 신청할 수 있습니다.");
      const enrollment = {
        id: Date.now(),
        proposalId: Number(proposalId),
        title: p.title,
      };
      s.enrollments.push(enrollment);
      save(s);
      return enrollment;
    },
    cancelEnrollment: async (id) => {
      requireEnrollmentOpen();
      const s = load();
      s.enrollments = (s.enrollments || []).filter((e) => e.id !== Number(id));
      save(s);
    },
    teacherProposals: async ({ cursor } = {}) => {
      const { id: teacherId } = requireRole("TEACHER");
      const items = load().proposals
        .filter(
          (p) => !p.withdrawnByAuthor && (p.status === "SUBMITTED" ||
            (p.status === "SURVEYING" && p.awaitingTeacher) ||
            p.responsibleTeacherId === teacherId),
        )
        .sort((a, b) => b.id - a.id);
      return page(items, cursor);
    },
    timeSlots: async () => ({
      items: schoolTimeSlots.map((slot) => ({ ...slot })),
    }),
    acceptProposal: async (id, { timeSlotIds, voteEndAt }) => {
      const { id: teacherId } = requireRole("TEACHER");
      const s = load(),
        p = find(s, id);
      if (p.status !== "SUBMITTED" && !(p.status === "SURVEYING" && p.awaitingTeacher))
        throw new Error("접수 대기 중인 제안만 수락할 수 있습니다.");
      const deadline = Date.parse(voteEndAt);
      if (!Number.isFinite(deadline) || deadline <= now())
        throw new Error("일정 투표 마감은 현재보다 늦어야 합니다.");
      if (
        !Array.isArray(timeSlotIds) ||
        !timeSlotIds.length ||
        new Set(timeSlotIds).size !== timeSlotIds.length ||
        timeSlotIds.some(
          (slotId) => !schoolTimeSlots.some((slot) => slot.id === slotId),
        )
      )
        throw new Error("학교 시간표에서 서로 다른 일정 후보를 선택해 주세요.");
      const voteDeadline = new Date(deadline).toISOString();
      Object.assign(p, {
        status: "VOTING",
        awaitingTeacher: false,
        responsibleTeacherId: teacherId,
        requiresInterest: false,
        voteDeadline,
        voteEndAt: voteDeadline,
        slots: schoolTimeSlots
          .filter((slot) => timeSlotIds.includes(slot.id))
          .map((slot) => ({ ...slot })),
      });
      save(s);
      return p;
    },
    closeProposalVote: async (id) => {
      const current = requireRole("TEACHER");
      const s = load(),
        p = find(s, id);
      if (p.responsibleTeacherId !== current.id) {
        const error = new Error("제안을 수락한 담당 선생님만 투표를 마감할 수 있습니다.");
        error.status = 403;
        throw error;
      }
      const stamp = now();
      if (p.status !== "VOTING" || !(Date.parse(p.voteDeadline) > stamp)) {
        throw new Error("이미 마감된 투표입니다.");
      }
      const deadline = new Date(stamp).toISOString();
      p.status = "REVIEWING";
      p.voteDeadline = p.voteEndAt = deadline;
      save(s);
      return p;
    },
    confirmProposal: async (id, { timeSlotId }) => {
      const current = requireRole("TEACHER");
      const s = load(),
        p = find(s, id);
      if (p.responsibleTeacherId !== current.id) {
        const error = new Error("제안을 수락한 담당 교사만 수업을 확정할 수 있습니다.");
        error.status = 403;
        throw error;
      }
      if (
        !["VOTING", "REVIEWING"].includes(p.status) ||
        !(Date.parse(p.voteDeadline) <= now())
      )
        throw new Error("일정 투표 마감 후에 수업을 확정할 수 있습니다.");
      const slot = p.slots.find((candidate) => candidate.id === timeSlotId);
      if (!slot) throw new Error("투표에 사용된 일정 후보를 선택해 주세요.");
      Object.assign(p, {
        status: "CONFIRMED",
        timeSlotId: slot.id,
        instructorName: current.name,
        courseTime: slot.label,
        enrollmentCount: 0,
      });
      save(s);
      return p;
    },
    reviewList: async () => ({
      items: load().proposals.filter((p) =>
        ["SURVEYING", "DRAFT"].includes(p.status),
      ),
    }),
    reviewDetail: async (id) => ({
      proposal: find(load(), id),
      teacherOpinion: null,
      similarProposals: [],
    }),
    review: async (id, body) => {
      const s = load(),
        p = find(s, id);
      if (p.status === "SUBMITTED" || p.responsibleTeacherId != null)
        throw new Error("교사 제안 관리에서 이 제안을 처리해 주세요.");
      if (
        !["APPROVE", "REQUEST_CHANGES", "REJECT", "HOLD"].includes(body.action)
      )
        throw new Error("처리 방식을 선택해 주세요.");
      if (body.action !== "APPROVE" && !body.reason?.trim())
        throw new Error("처리 사유를 입력해 주세요.");
      if (
        body.action === "APPROVE" &&
        (!(body.threshold > 0) ||
          !body.surveyDeadline ||
          new Date(body.surveyDeadline) <= new Date())
      )
        throw new Error("유효한 임계치와 미래 마감일을 입력해 주세요.");
      p.status = {
        APPROVE: "SURVEYING",
        REQUEST_CHANGES: "DRAFT",
        REJECT: "REJECTED",
        HOLD: "ON_HOLD",
      }[body.action];
      if (body.action === "APPROVE") {
        p.threshold = body.threshold;
        p.surveyDeadline = body.surveyDeadline;
      }
      p.reviewReason = body.reason;
      save(s);
      return p;
    },
    similar: async (body) => ({
      items: load()
        .proposals.filter(
          (p) =>
            !p.withdrawnByAuthor &&
            (p.title.includes(body.title.trim()) || body.title.includes(p.title)),
        )
        .slice(0, 3),
    }),
    startDemo: async () => {
      session.setItem(SESSION_KEY, "active");
      return user;
    },
    startTeacherDemo: async () => {
      session.setItem(SESSION_KEY, "teacher");
      return teacher;
    },
    me: async () => requireUser(),
    login: async () => {
      throw new Error("실제 로그인은 API 모드에서 이용해 주세요.");
    },
    logout: async () => {
      session.setItem(SESSION_KEY, "");
    },
    list: async ({
      q = "",
      category = "",
      status = "",
      grade = "",
      sort = "interest",
      cursor,
    } = {}) => {
      let items = load().proposals.filter(
        (p) =>
          !p.withdrawnByAuthor &&
          (!q || p.title.includes(q) || p.description.includes(q)) &&
          (!category || p.category === category) &&
          (!status || p.status === status) &&
          (!grade || p.targetGrades.includes(Number(grade))),
      );
      items.sort(
        sort === "latest"
          ? (a, b) => b.id - a.id
          : sort === "deadline"
            ? (a, b) =>
                new Date(a.voteDeadline || a.surveyDeadline || "9999-12-31") -
                new Date(b.voteDeadline || b.surveyDeadline || "9999-12-31")
            : (a, b) => b.interestCount - a.interestCount,
      );
      return page(items, cursor);
    },
    detail: async (id) => {
      const s = load(),
        p = find(s, id);
      return { ...p, myInterest: isStudentProposal(p) ? null : s.interests[p.id] || null };
    },
    create: async ({ publishForSurvey = false, ...body }) => {
      if (publishForSurvey) requireRole("STUDENT");
      const s = load();
      if (
        !body.title.trim() ||
        !body.description.trim() ||
        !body.targetGrades.length
      )
        throw new Error("필수 항목을 입력해 주세요.");
      const p = {
        ...body,
        id: Math.max(...s.proposals.map((p) => p.id), 0) + 1,
        status: publishForSurvey ? "SURVEYING" : "DRAFT",
        awaitingTeacher: publishForSurvey,
        interestCount: 0,
        ...(publishForSurvey ? {} : { threshold: 20 }),
        proposerId: user.id,
        proposerName: user.name,
        icon: "✦",
      };
      s.proposals.push(p);
      save(s);
      return p;
    },
    submitProposal: async (id) => {
      requireRole("STUDENT");
      const s = load(),
        p = find(s, id);
      if (!isStudentProposal(p) || p.status !== "DRAFT")
        throw new Error("본인이 작성한 임시저장 제안만 제출할 수 있습니다.");
      p.status = "SUBMITTED";
      delete p.threshold;
      delete p.surveyDeadline;
      save(s);
      return p;
    },
    updateProposal: async (id, changes) => {
      requireRole("STUDENT");
      const s = load(),
        p = find(s, id);
      requireProposalOwner(p);
      if (!editableProposal(p)) {
        const error = new Error("일정 투표가 열리기 전까지만 제안을 수정할 수 있습니다.");
        error.status = 422;
        throw error;
      }
      if (!changes.title.trim() || !changes.description.trim() || !changes.targetGrades.length) {
        throw new Error("필수 항목을 입력해 주세요.");
      }
      for (const field of [
        "title", "description", "activityPlan", "category", "targetGrades",
        "capacity", "instructorType", "instructorName", "referenceUrl",
      ]) {
        if (Object.hasOwn(changes, field)) p[field] = changes[field];
      }
      save(s);
      return p;
    },
    deleteProposal: async (id) => {
      requireRole("STUDENT");
      const s = load(),
        p = find(s, id, { includeWithdrawn: true });
      requireProposalOwner(p);
      if (p.withdrawnByAuthor) return { id: p.id, status: p.status };
      if (!editableProposal(p) && (p.status !== "REJECTED" || p.voteEndAt || p.voteDeadline)) {
        const error = new Error("일정 투표가 열리기 전까지만 제안을 삭제할 수 있습니다.");
        error.status = 422;
        throw error;
      }
      p.status = "ARCHIVED";
      p.withdrawnByAuthor = true;
      p.awaitingTeacher = false;
      save(s);
      return { id: p.id, status: p.status };
    },
    interest: async (id, body) => {
      const s = load(),
        p = find(s, id);
      if (isStudentProposal(p)) {
        const error = new Error("내가 올린 제안에는 관심을 표시할 수 없습니다.");
        error.status = 403;
        throw error;
      }
      if (
        !surveyOpen(p) ||
        !p.targetGrades.includes(user.grade)
      )
        throw new Error("관심 표시 기간 또는 대상 학년을 확인해 주세요.");
      if (![1, 2, 3].includes(body.intentLevel))
        throw new Error("참여 의향을 선택해 주세요.");
      if (!s.interests[id]) p.interestCount++;
      s.interests[id] = body;
      save(s);
      return body;
    },
    cancelInterest: async (id) => {
      const s = load(),
        p = find(s, id);
      if (!surveyOpen(p))
        throw new Error("수요조사 기간에만 취소할 수 있습니다.");
      if (s.interests[id]) {
        delete s.interests[id];
        if (!isStudentProposal(p)) p.interestCount--;
      }
      save(s);
    },
    vote: async (id) => {
      const s = load();
      return voteInfo(s, find(s, id));
    },
    votableProposals: async ({ cursor } = {}) => {
      requireRole("STUDENT");
      const s = load();
      const items = s.proposals
        .filter((p) => voteInfo(s, p).canVote)
        .sort((a, b) => Date.parse(a.voteDeadline) - Date.parse(b.voteDeadline));
      return page(items, cursor);
    },
    submitVote: async (id, { responses }) => {
      const s = load(),
        p = find(s, id),
        info = voteInfo(s, p);
      if (!info.canVote)
        throw new Error("투표 자격 또는 마감 시각을 확인해 주세요.");
      if (
        !Array.isArray(responses) ||
        responses.length !== info.slots.length ||
        new Set(responses.map((r) => r.slotId)).size !== info.slots.length ||
        responses.some(
          (r) =>
            !info.slots.some((t) => t.id === r.slotId) ||
            !availability[r.availability],
        )
      )
        throw new Error("모든 후보 시간에 응답해 주세요.");
      s.votes[id] = responses;
      save(s);
      return { responses };
    },
    result: async (id) => {
      const s = load(),
        p = find(s, id),
        votes = s.votes[id] || [];
      return {
        totalRespondents: votes.length ? 1 : 0,
        slots: (p.slots || []).map((slot) => {
          const v = votes.find((v) => v.slotId === slot.id);
          return {
            ...slot,
            availableCount: v?.availability === "AVAILABLE" ? 1 : 0,
            adjustableCount: v?.availability === "ADJUSTABLE" ? 1 : 0,
            unavailableCount: v?.availability === "UNAVAILABLE" ? 1 : 0,
          };
        }),
      };
    },
    myInterests: async () => {
      const s = load();
      return {
        items: s.proposals.filter((p) => !p.withdrawnByAuthor && !isStudentProposal(p) && s.interests[p.id]),
      };
    },
    myProposals: async () => ({
      items: load().proposals.filter((p) => !p.withdrawnByAuthor && isStudentProposal(p)),
    }),
  };
}
