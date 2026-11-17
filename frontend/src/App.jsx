import { useState, useEffect, createContext, useContext } from "react";
import {
  Link,
  NavLink,
  Routes,
  Route,
  useParams,
  useNavigate,
} from "react-router-dom";
import { service, demoMode, categories, statuses } from "./lib/service";
import { availability } from "./lib/demo";
const Auth = createContext(null);
const date = (value) =>
  value
    ? new Date(value).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "미정";
function ErrorBox({ error, retry }) {
  return (
    <div className="error" role="alert">
      {error?.message || error}
      {retry && (
        <button className="quiet" onClick={retry}>
          다시 시도
        </button>
      )}
    </div>
  );
}
function useResource(loader, deps = []) {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: null });
    Promise.resolve()
      .then(loader)
      .then((data) => {
        if (active) setState({ loading: false, data, error: null });
      })
      .catch((error) => {
        if (active) setState({ loading: false, data: null, error });
      });
    return () => {
      active = false;
    };
  }, [...deps, revision]);
  return { ...state, reload: () => setRevision((v) => v + 1) };
}
function Resource({ resource, children }) {
  if (resource.loading)
    return (
      <p role="status" className="empty">
        불러오는 중…
      </p>
    );
  if (resource.error)
    return <ErrorBox error={resource.error} retry={resource.reload} />;
  return children(resource.data);
}
function Tag({ status }) {
  return <span className={`tag ${status}`}>{statuses[status] || status}</span>;
}
function Card({ p }) {
  return (
    <Link className="card" to={`/proposals/${p.id}`}>
      <div className={`art art-${p.category}`} aria-hidden="true">
        <span>{p.icon || "✦"}</span>
        <small>AFTER CLASS</small>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>{categories[p.category]}</span>
          <Tag status={p.status} />
        </div>
        <h3>{p.title}</h3>
        <p className="description">{p.description}</p>
        <p className="muted">
          {p.targetGrades?.join("·")}학년 · 제안자 {p.proposerName}
        </p>
        <div className="progress">
          <span
            style={{
              width: `${Math.min(100, (p.interestCount / (p.threshold || 1)) * 100)}%`,
            }}
          />
        </div>
        <div className="card-bottom">
          <span>
            관심 <b>{p.interestCount}</b>명{" "}
            <small>/ 목표 {p.threshold}명</small>
          </span>
          <span>자세히 →</span>
        </div>
      </div>
    </Link>
  );
}
function Home() {
  const [q, setQ] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [grade, setGrade] = useState(""),
    [sort, setSort] = useState("interest");
  const r = useResource(
    () => service.list({ q: query, category, status, grade, sort }),
    [query, category, status, grade, sort],
  );
  const [extra, setExtra] = useState([]),
    [cursor, setCursor] = useState(null),
    [moreError, setMoreError] = useState(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setExtra([]);
    setCursor(null);
    setMoreError(null);
  }, [query, category, status, grade, sort]);
  async function more() {
    setBusy(true);
    setMoreError(null);
    try {
      const page = await service.list({
        q: query,
        category,
        status,
        grade,
        sort,
        cursor: cursor || r.data.nextCursor,
      });
      setExtra((v) => [...v, ...page.items]);
      setCursor(page.nextCursor || "END");
    } catch (e) {
      setMoreError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">우리의 선택으로 시작하는 방과후</p>
          <h1>
            배우고 싶은 수업,
            <br />
            <em>우리가 직접 만들어요.</em>
          </h1>
          <p>
            관심을 모으고, 가능한 시간에 투표하세요.
            <br />
            여러분의 한 표가 새로운 수업의 시작이 됩니다.
          </p>
          <Link className="button" to="/proposals/new">
            + 수업 제안하기
          </Link>
        </div>
        <div className="hero-graphic" aria-hidden="true">
          <span className="orbit">✳</span>
          <div className="ballot">
            MY NEXT CLASS<div>✓ 나의 관심</div>
            <div>✓ 우리의 시간</div>
            <b>한 표의 가능성 ↗</b>
          </div>
          <span className="spark">✦</span>
        </div>
      </section>
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR NEXT CLASS</p>
            <h2>함께 만들고 싶은 수업</h2>
          </div>
          <Link to="/guide">어떻게 참여하나요? ↗</Link>
        </div>
        <div className="filters">
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(q.trim());
            }}
          >
            <input
              aria-label="수업 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="배우고 싶은 수업을 찾아보세요"
            />
            <button type="submit" className="quiet">
              검색
            </button>
          </form>
          <select
            aria-label="상태"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">모든 상태</option>
            {Object.entries(statuses).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="학년"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">모든 학년</option>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}학년
              </option>
            ))}
          </select>
          <select
            aria-label="정렬"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="interest">관심 인원순</option>
            <option value="latest">최신순</option>
            <option value="deadline">마감 임박순</option>
          </select>
        </div>
        <div className="chips" aria-label="분류 필터">
          {[["", "전체"], ...Object.entries(categories)].map(([k, v]) => (
            <button
              key={k}
              aria-pressed={category === k}
              className={category === k ? "chip active" : "chip"}
              onClick={() => setCategory(k)}
            >
              {v}
            </button>
          ))}
        </div>
        <Resource resource={r}>
          {(data) => (
            <>
              <div className="cards">
                {[...data.items, ...extra].map((p) => (
                  <Card key={p.id} p={p} />
                ))}
              </div>
              {!data.items.length && (
                <p className="empty">
                  조건에 맞는 수업이 없어요. 다른 키워드로 찾아보세요.
                </p>
              )}
              {cursor !== "END" && data.nextCursor && (
                <button disabled={busy} className="load-more" onClick={more}>
                  {busy ? "불러오는 중…" : "더 보기"}
                </button>
              )}
              {moreError && <ErrorBox error={moreError} />}
            </>
          )}
        </Resource>
      </section>
    </>
  );
}
function Detail() {
  const { id } = useParams();
  const auth = useContext(Auth);
  const r = useResource(() => service.detail(id), [id]);
  return (
    <Resource resource={r}>
      {(p) => (
        <>
          <Link className="back" to="/">
            ← 수업 목록
          </Link>
          <section className="detail-grid">
            <article>
              <Tag status={p.status} />
              <h1>{p.title}</h1>
              <p className="muted">
                {categories[p.category]} · {p.targetGrades?.join("·")}학년 ·{" "}
                {p.proposerName}
              </p>
              <div
                className={`detail-art art-${p.category}`}
                aria-hidden="true"
              >
                {p.icon || "✦"}
              </div>
              <h2>이런 수업을 함께해요</h2>
              <p className="preline">{p.description}</p>
              <div className="steps">
                <span>01 수업 제안</span>
                <span>02 관심 모으기</span>
                <span>03 일정 투표</span>
                <span>04 개설 검토</span>
              </div>
            </article>
            <aside className="panel">
              <p className="eyebrow">작은 관심이 수업이 돼요</p>
              <h2>
                관심 <em>{p.interestCount}명</em>
              </h2>
              <p>개설 목표 {p.threshold}명</p>
              <div className="progress">
                <span
                  style={{
                    width: `${Math.min(100, (p.interestCount / (p.threshold || 1)) * 100)}%`,
                  }}
                />
              </div>
              {p.status === "SURVEYING" ? (
                <>
                  <p className="muted">
                    수요조사 마감 {date(p.surveyDeadline)} (한국 시간)
                  </p>
                  <Interest
                    key={`${id}-${JSON.stringify(p.myInterest)}`}
                    p={p}
                    user={auth.user}
                    reload={r.reload}
                  />
                </>
              ) : p.status === "VOTING" ? (
                <>
                  <p>후보 시간별로 참여 가능 여부를 알려주세요.</p>
                  <p className="muted">
                    마감 {date(p.voteDeadline)} (한국 시간)
                  </p>
                  <Link className="button block" to={`/proposals/${id}/vote`}>
                    일정 투표하기 →
                  </Link>
                  <Link className="text-link" to={`/proposals/${id}/result`}>
                    투표 결과 확인
                  </Link>
                </>
              ) : (
                <p>
                  {p.status === "DRAFT"
                    ? "임시저장한 제안입니다. 공동제안자 5명 이상의 동의 후 제출할 수 있습니다."
                    : "현재 관심 표시나 일정 투표를 진행하지 않는 수업입니다."}
                </p>
              )}
            </aside>
          </section>
        </>
      )}
    </Resource>
  );
}
function Interest({ p, user, reload }) {
  const [intent, setIntent] = useState(p.myInterest?.intentLevel || 0),
    [comment, setComment] = useState(p.myInterest?.comment || ""),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  const eligible =
    user?.role === "STUDENT" &&
    p.targetGrades.includes(user.grade) &&
    new Date(p.surveyDeadline) > new Date();
  async function act(cancel = false) {
    setBusy(true);
    setError(null);
    try {
      if (cancel) await service.cancelInterest(p.id);
      else await service.interest(p.id, { intentLevel: intent, comment });
      reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        act();
      }}
    >
      <fieldset disabled={!eligible || busy}>
        <legend>참여 의향</legend>
        {[
          [1, "개설되면 반드시 신청"],
          [2, "시간이 맞으면 신청"],
          [3, "관심만 있어요"],
        ].map(([n, label]) => (
          <label className="choice" key={n}>
            <input
              required
              type="radio"
              name="intent"
              checked={intent === n}
              onChange={() => setIntent(n)}
            />
            {label}
          </label>
        ))}
        <label className="field">
          의견 (선택)
          <textarea
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="수업에 바라는 점을 적어주세요"
          />
        </label>
        <button className="block" disabled={!intent}>
          {busy
            ? "저장 중…"
            : p.myInterest
              ? "관심 표시 수정"
              : "관심 표시하기"}
        </button>
        {p.myInterest && (
          <>
            <p role="status">관심 표시가 저장되어 있습니다.</p>
            <button
              type="button"
              className="quiet block"
              onClick={() => act(true)}
            >
              관심 취소
            </button>
          </>
        )}
      </fieldset>
      {!eligible && (
        <p className="muted">
          대상 학년의 학생만 수요조사 기간에 참여할 수 있습니다.
        </p>
      )}
      {error && <ErrorBox error={error} />}
    </form>
  );
}
function Vote() {
  const { id } = useParams();
  const r = useResource(
    () => Promise.all([service.detail(id), service.vote(id)]),
    [id],
  );
  return (
    <Resource resource={r}>
      {([p, v]) => <VoteForm key={id} p={p} v={v} />}
    </Resource>
  );
}
function VoteForm({ p, v }) {
  const [answers, setAnswers] = useState(
      Object.fromEntries(
        (v.responses || []).map((r) => [r.slotId, r.availability]),
      ),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [saved, setSaved] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const closed = !v.deadline || new Date(v.deadline).getTime() <= now,
    canVote = v.canVote && !closed;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      await service.submitVote(p.id, {
        responses: v.slots.map((s) => ({
          slotId: s.id,
          availability: answers[s.id],
        })),
      });
      setSaved(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="narrow">
      <Link className="back" to={`/proposals/${p.id}`}>
        ← 수업 상세
      </Link>
      <p className="eyebrow">SCHEDULE VOTE</p>
      <h1>함께할 시간을 골라주세요</h1>
      <p>{p.title}</p>
      <div className="info">
        마감 {date(v.deadline)} (한국 시간) · 기간 내 수정 가능
        <br />
        관심 의향 1·2로 참여한 학생만 투표할 수 있어요.
      </div>
      {!canVote && (
        <p role="alert" className="error">
          {closed
            ? "투표가 마감되었거나 일정이 정해지지 않았습니다."
            : "이 수업의 일정 투표에 참여할 자격이 없습니다."}
        </p>
      )}
      <form
        className="panel"
        onSubmit={submit}
        onChange={() => setSaved(false)}
      >
        <fieldset disabled={!canVote || busy}>
          <legend>각 후보 시간에 하나씩 응답해 주세요</legend>
          {v.slots.map((s) => (
            <fieldset className="slot" key={s.id}>
              <legend>
                {s.day} · {s.period}교시
              </legend>
              <div className="slot-choices">
                {Object.entries(availability).map(([value, label]) => (
                  <label
                    className={`availability ${answers[s.id] === value ? value : ""}`}
                    key={value}
                  >
                    <input
                      required
                      type="radio"
                      name={`slot-${s.id}`}
                      checked={answers[s.id] === value}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [s.id]: value }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <button
            className="block"
            disabled={!v.slots.length || v.slots.some((s) => !answers[s.id])}
          >
            {busy ? "제출 중…" : "투표 제출하기"}
          </button>
        </fieldset>
        {error && <ErrorBox error={error} />}
        {saved && (
          <div role="status" className="success">
            투표가 저장되었습니다. 기간 안에는 수정할 수 있어요.
          </div>
        )}
        <Link className="text-link" to={`/proposals/${p.id}/result`}>
          투표 결과 확인 →
        </Link>
      </form>
    </section>
  );
}
function Results() {
  const { id } = useParams();
  const r = useResource(
    () => Promise.all([service.detail(id), service.result(id)]),
    [id],
  );
  return (
    <Resource resource={r}>
      {([p, result]) => (
        <section className="narrow">
          <Link to={`/proposals/${id}`} className="back">
            ← 수업 상세
          </Link>
          <p className="eyebrow">VOTE RESULTS</p>
          <h1>우리의 시간이 모이고 있어요</h1>
          <p>
            {p.title} · 응답 {result.totalRespondents}명
          </p>
          <p className="muted">
            최종 수업 시간은 관리자가 결정합니다. 아래는 현재 응답 현황입니다.
          </p>
          <div className="panel table-wrap">
            <table>
              <caption>후보 시간별 참여 가능 인원</caption>
              <thead>
                <tr>
                  <th>후보 시간</th>
                  <th>가능</th>
                  <th>조정 가능</th>
                  <th>불가능</th>
                </tr>
              </thead>
              <tbody>
                {result.slots.map((s) => (
                  <tr key={s.id}>
                    <th>
                      {s.day} {s.period}교시
                    </th>
                    <td className={s.availableCount ? "heat" : ""}>
                      {s.availableCount}명
                    </td>
                    <td>{s.adjustableCount}명</td>
                    <td>{s.unavailableCount}명</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!result.slots.length && (
              <p className="empty">아직 투표 후보 시간이 없습니다.</p>
            )}
          </div>
          <button className="quiet" onClick={r.reload}>
            결과 새로고침
          </button>{" "}
          <Link to={`/proposals/${id}/vote`}>내 투표 확인·수정 →</Link>
        </section>
      )}
    </Resource>
  );
}
function NewProposal() {
  const navigate = useNavigate();
  const { user } = useContext(Auth);
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!f.getAll("grades").length) {
      setError(new Error("대상 학년을 한 개 이상 선택해 주세요."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const p = await service.create({
        title: f.get("title").trim(),
        description: f.get("description").trim(),
        category: f.get("category"),
        targetGrades: f.getAll("grades").map(Number),
        instructorType: f.get("instructorType"),
      });
      navigate(`/proposals/${p.id}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="narrow">
      <p className="eyebrow">START SOMETHING NEW</p>
      <h1>어떤 수업을 배우고 싶나요?</h1>
      <p>
        제안을 임시저장하세요. 제출에는 공동제안자 5명 이상의 동의가 필요합니다.
      </p>
      <form className="panel" onSubmit={submit}>
        <fieldset disabled={busy || user?.role !== "STUDENT"}>
          <label className="field">
            수업 이름
            <input name="title" required maxLength={100} />
          </label>
          <label className="field">
            분류
            <select name="category">
              {Object.entries(categories).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            수업 소개
            <textarea name="description" required maxLength={3000} />
          </label>
          <fieldset>
            <legend>대상 학년 (한 개 이상)</legend>
            <div className="chips">
              {[1, 2, 3].map((n) => (
                <label key={n}>
                  <input name="grades" type="checkbox" value={n} />
                  {n}학년
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field">
            희망 강사
            <select name="instructorType">
              <option value="ANY">무관</option>
              <option value="INTERNAL">교내 교사</option>
              <option value="EXTERNAL">외부 강사</option>
            </select>
          </label>
          <button className="block">
            {busy ? "저장 중…" : "제안 임시저장"}
          </button>
        </fieldset>
        {error && <ErrorBox error={error} />}
      </form>
    </section>
  );
}
function My() {
  const r = useResource(() =>
    Promise.all([service.myInterests(), service.myProposals()]),
  );
  return (
    <section>
      <p className="eyebrow">MY AFTER</p>
      <h1>나의 참여</h1>
      <Resource resource={r}>
        {([interests, proposals]) => (
          <>
            {[
              [interests, "관심 표시한 수업"],
              [proposals, "내가 제안한 수업"],
            ].map(([data, title]) => (
              <section className="my-section" key={title}>
                <h2>{title}</h2>
                {data.items.length ? (
                  <div className="cards">
                    {data.items.map((p) => (
                      <Card p={p} key={p.id} />
                    ))}
                  </div>
                ) : (
                  <p className="empty">아직 참여한 수업이 없어요.</p>
                )}
              </section>
            ))}
          </>
        )}
      </Resource>
    </section>
  );
}
function Login() {
  const { reload } = useContext(Auth);
  const navigate = useNavigate();
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await service.login({
        username: f.get("username"),
        password: f.get("password"),
        rememberMe: f.has("rememberMe"),
      });
      await reload();
      navigate("/");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-page">
      <p className="eyebrow">WELCOME TO AFTER</p>
      <h1>우리의 다음 수업을 만나요.</h1>
      <form className="panel" onSubmit={submit}>
        <label className="field">
          아이디
          <input name="username" autoComplete="username" required />
        </label>
        <label className="field">
          비밀번호
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label className="remember">
          <input name="rememberMe" type="checkbox" />
          로그인 유지
        </label>
        {error && <ErrorBox error={error} />}
        <button className="block" disabled={busy}>
          {busy ? "로그인 중…" : "로그인"}
        </button>
        <Link className="text-link" to="/signup">
          회원가입
        </Link>
      </form>
    </section>
  );
}
function Signup() {
  const [message, setMessage] = useState(""),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    setBusy(true);
    setError(null);
    try {
      await service.signup({
        username: f.get("username"),
        password: f.get("password"),
        name: f.get("name"),
        studentNumber: f.get("studentNumber"),
        signupCode: f.get("signupCode"),
      });
      setMessage("가입 신청이 접수되었습니다. 관리자 승인 후 로그인해 주세요.");
      form.reset();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-page">
      <h1>After 회원가입</h1>
      <p>가입 인증코드로 역할이 결정되며 관리자 승인이 필요합니다.</p>
      <form className="panel" onSubmit={submit}>
        {[
          ["username", "아이디", "text"],
          ["password", "비밀번호", "password"],
          ["name", "이름", "text"],
          ["studentNumber", "학번 (학생)", "text"],
          ["signupCode", "가입 인증코드", "text"],
        ].map(([name, label, type]) => (
          <label className="field" key={name}>
            {label}
            <input
              name={name}
              type={type}
              required={name !== "studentNumber"}
              maxLength={100}
            />
          </label>
        ))}
        <button disabled={busy} className="block">
          {busy ? "접수 중…" : "가입 신청"}
        </button>
        {error && <ErrorBox error={error} />}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
function Guide() {
  return (
    <section className="narrow">
      <p className="eyebrow">HOW IT WORKS</p>
      <h1>한 표로 시작하는 새로운 수업</h1>
      {[
        [
          "01",
          "수업을 제안해요",
          "배우고 싶은 수업을 작성하고, 공동제안자 5명 이상의 동의를 모아 제출합니다.",
        ],
        [
          "02",
          "관심을 모아요",
          "검토를 통과한 제안에 참여 의향과 의견을 남겨주세요. 대상 학년만 참여할 수 있습니다.",
        ],
        [
          "03",
          "시간에 투표해요",
          "관심 의향 1·2로 참여한 학생은 후보 시간마다 가능·조정 가능·불가능을 선택합니다.",
        ],
        [
          "04",
          "개설을 기다려요",
          "관리자가 투표 결과와 강사·교실·예산을 검토해 최종 개설 및 시간을 결정합니다.",
        ],
      ].map(([n, t, d]) => (
        <article className="guide-step" key={n}>
          <strong>{n}</strong>
          <div>
            <h2>{t}</h2>
            <p>{d}</p>
          </div>
        </article>
      ))}
      <Link className="button" to="/">
        수업 둘러보기 →
      </Link>
    </section>
  );
}
function Protected({ children }) {
  const auth = useContext(Auth);
  if (auth.loading) return <p role="status">세션을 확인하고 있습니다.</p>;
  if (!auth.user)
    return (
      <section className="empty">
        <h1>로그인이 필요합니다.</h1>
        <Link className="button" to="/login">
          로그인하기
        </Link>
      </section>
    );
  return children;
}
export default function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [authError, setAuthError] = useState(null);
  async function reload() {
    setLoading(true);
    try {
      setUser(await service.me());
      setAuthError(null);
    } catch (e) {
      setUser(null);
      if (e.status !== 401) setAuthError(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  async function logout() {
    try {
      await service.logout();
      setUser(null);
    } catch (e) {
      setAuthError(e);
    }
  }
  return (
    <Auth.Provider value={{ user, loading, reload }}>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">
            after<span>●</span>
          </Link>
          <nav aria-label="주 메뉴">
            <NavLink to="/" end>
              수업 둘러보기
            </NavLink>
            <NavLink to="/my">나의 참여</NavLink>
            <NavLink to="/guide">이용 안내</NavLink>
          </nav>
          <div className="account">
            {user ? (
              <>
                <span>
                  {user.name}
                  {demoMode ? " · 체험" : ""}
                </span>
                {!demoMode && (
                  <button className="quiet" onClick={logout}>
                    로그아웃
                  </button>
                )}
              </>
            ) : (
              <Link to="/login">로그인 →</Link>
            )}
          </div>
        </div>
      </header>
      {demoMode && (
        <div className="mode-banner">
          체험 모드 · 예시 수업과 내 응답은 이 브라우저에만 저장됩니다. 실제
          학교 투표가 아닙니다.
        </div>
      )}
      <main>
        {authError && <ErrorBox error={authError} retry={reload} />}
        <Routes>
          <Route
            path="/"
            element={
              <Protected>
                <Home />
              </Protected>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/signup"
            element={
              demoMode ? (
                <section className="empty">
                  체험 모드에서는 회원가입할 수 없습니다.{" "}
                  <Link to="/">수업 둘러보기</Link>
                </section>
              ) : (
                <Signup />
              )
            }
          />
          <Route path="/guide" element={<Guide />} />
          <Route
            path="/my"
            element={
              <Protected>
                <My />
              </Protected>
            }
          />
          <Route
            path="/proposals/new"
            element={
              <Protected>
                <NewProposal />
              </Protected>
            }
          />
          <Route
            path="/proposals/:id"
            element={
              <Protected>
                <Detail />
              </Protected>
            }
          />
          <Route
            path="/proposals/:id/vote"
            element={
              <Protected>
                <Vote />
              </Protected>
            }
          />
          <Route
            path="/proposals/:id/result"
            element={
              <Protected>
                <Results />
              </Protected>
            }
          />
          <Route
            path="*"
            element={
              <section className="empty">
                <h1>페이지를 찾을 수 없습니다.</h1>
                <Link to="/">수업 목록으로</Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer>
        <Link className="brand" to="/">
          after<span>●</span>
        </Link>
        <p>배우고 싶은 내일을, 함께 만듭니다.</p>
        <small>학생이 제안하는 방과후 수업 플랫폼</small>
      </footer>
    </Auth.Provider>
  );
}
