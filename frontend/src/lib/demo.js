const KEY = "after.voting.v1";
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
          { id: 3, day: "금요일", period: 9 },
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
        description:
          "다양한 디자인 분야를 탐색하고 나만의 포트폴리오를 만들어 봐요.",
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
    ],
    interests: { 2: { intentLevel: 2, comment: "" } },
    votes: {},
  };
}
export function createDemo(
  storage = localStorage,
  session = typeof sessionStorage === "undefined" ? storage : sessionStorage,
) {
  function load() {
    const raw = storage.getItem(KEY);
    if (!raw) return seed();
    try {
      const s = JSON.parse(raw);
      if (!Array.isArray(s.proposals) || !s.interests || !s.votes)
        throw Error();
      return s;
    } catch {
      throw new Error(
        "체험 데이터를 읽지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
      );
    }
  }
  function save(s) {
    storage.setItem(KEY, JSON.stringify(s));
  }
  function find(s, id) {
    const p = s.proposals.find((p) => p.id === Number(id));
    if (!p) throw new Error("제안을 찾을 수 없습니다.");
    return p;
  }
  const user = {
    id: 1,
    name: "김학생",
    grade: 1,
    role: "STUDENT",
    status: "ACTIVE",
  };
  function voteInfo(s, p) {
    return {
      slots: p.slots || [],
      deadline: p.voteDeadline,
      canVote:
        p.status === "VOTING" &&
        [1, 2].includes(s.interests[p.id]?.intentLevel) &&
        p.targetGrades.includes(user.grade),
      responses: s.votes[p.id] || [],
    };
  }
  return {
    usernameCheck: async (username) => ({ available: username !== "junho07" }),
    signup: async () => {
      throw new Error(
        "체험 모드에서는 가입 신청을 서버에 전송하지 않습니다. 실제 API 모드에서 이용해 주세요.",
      );
    },
    courses: async () => ({
      items: load()
        .proposals.filter((p) => ["ENROLLING", "CONFIRMED"].includes(p.status))
        .map((p) => ({
          ...p,
          capacity: 20,
          enrollmentCount: p.id === 2 ? 14 : 9,
          canEnroll: p.status === "ENROLLING",
          enrollmentDeadline: deadline(),
          courseTime: p.id === 2 ? "수요일 8교시" : "화요일 9교시",
        })),
    }),
    enrollments: async () => ({ items: load().enrollments || [] }),
    enroll: async (proposalId) => {
      const s = load(),
        p = find(s, proposalId);
      if (p.status !== "ENROLLING")
        throw new Error("수강신청 가능한 수업이 아닙니다.");
      s.enrollments ||= [];
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
      const s = load();
      s.enrollments = (s.enrollments || []).filter((e) => e.id !== Number(id));
      save(s);
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
            p.title.includes(body.title.trim()) || body.title.includes(p.title),
        )
        .slice(0, 3),
    }),
    invite: async (id) => {
      const s = load(),
        p = find(s, id);
      if (p.status !== "DRAFT" || p.proposerName !== user.name)
        throw new Error("내 작성중 제안에서만 초대할 수 있습니다.");
      throw new Error("체험 모드에서는 공동제안 초대를 발급하지 않습니다.");
    },
    startDemo: async () => {
      session.setItem("after.demo.session", "active");
      return user;
    },
    me: async () => {
      if (session.getItem("after.demo.session") !== "active") {
        const error = new Error("로그인이 필요합니다.");
        error.status = 401;
        throw error;
      }
      return user;
    },
    login: async () => {
      throw new Error("실제 로그인은 API 모드에서 이용해 주세요.");
    },
    logout: async () => {
      session.setItem("after.demo.session", "");
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
      const start = Number(cursor || 0);
      return {
        items: items.slice(start, start + 20),
        nextCursor: items.length > start + 20 ? String(start + 20) : null,
      };
    },
    detail: async (id) => {
      const s = load(),
        p = find(s, id);
      return { ...p, myInterest: s.interests[p.id] || null };
    },
    create: async (body) => {
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
        status: "DRAFT",
        interestCount: 0,
        threshold: 20,
        proposerName: user.name,
        icon: "✦",
      };
      s.proposals.push(p);
      save(s);
      return p;
    },
    interest: async (id, body) => {
      const s = load(),
        p = find(s, id);
      if (
        p.status !== "SURVEYING" ||
        new Date(p.surveyDeadline) <= new Date() ||
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
      if (p.status !== "SURVEYING" || new Date(p.surveyDeadline) <= new Date())
        throw new Error("수요조사 기간에만 취소할 수 있습니다.");
      if (s.interests[id]) {
        delete s.interests[id];
        p.interestCount--;
      }
      save(s);
    },
    vote: async (id) => {
      const s = load();
      return voteInfo(s, find(s, id));
    },
    submitVote: async (id, { responses }) => {
      const s = load(),
        p = find(s, id),
        info = voteInfo(s, p);
      if (!info.canVote || new Date(info.deadline) <= new Date())
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
      return { items: s.proposals.filter((p) => s.interests[p.id]) };
    },
    myProposals: async () => ({
      items: load().proposals.filter((p) => p.proposerName === user.name),
    }),
  };
}
