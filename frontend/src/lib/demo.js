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
        title: "파이썬으로 만드는 나만의 서비스",
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
        title: "함께 뛰는 방과후 농구",
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
        title: "영화로 만나는 영어 회화",
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
        title: "나의 진로를 찾는 디자인 스튜디오",
        category: "CAREER",
        description:
          "다양한 디자인 분야를 탐색하고 나만의 포트폴리오를 만들어 봐요.",
        targetGrades: [1, 2, 3],
        status: "CONFIRMED",
        interestCount: 28,
        threshold: 20,
        proposerName: "정지우",
        icon: "✳",
      },
    ],
    interests: { 2: { intentLevel: 2, comment: "" } },
    votes: {},
  };
}
export function createDemo(storage = localStorage) {
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
    me: async () => user,
    login: async () => {
      throw new Error("실제 로그인은 API 모드에서 이용해 주세요.");
    },
    logout: async () => {},
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
