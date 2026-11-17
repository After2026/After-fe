import { useState, useEffect, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { service, categories, statuses, demoMode } from "../lib/service";
import {
  Auth,
  Resource,
  useResource,
  ErrorBox,
  Tag,
  Card,
  Icon,
  Progress,
  date,
} from "../ui";
export function Home() {
  const summary = useResource(() =>
    Promise.all([service.myInterests(), service.list({ status: "VOTING" })]),
  );
  const [q, setQ] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [grade, setGrade] = useState(""),
    [sort, setSort] = useState("interest");
  const [extra, setExtra] = useState([]),
    [cursor, setCursor] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const r = useResource(
    () => service.list({ q: query, category, status, grade, sort }),
    [query, category, status, grade, sort],
  );
  useEffect(() => {
    setExtra([]);
    setCursor(null);
    setError(null);
  }, [query, category, status, grade, sort]);
  async function more() {
    setBusy(true);
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
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="listing-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">2026학년도 2학기 · 제안·수요조사 기간</p>
          <h1>수업제안</h1>
          <p className="subtitle">
            배우고 싶은 수업에 관심을 모아, 우리의 방과후를 만들어요.
          </p>
        </div>
        <Link className="button desktop-create" to="/proposals/new">
          + 새 수업 제안하기
        </Link>
      </div>
      <section className="mobile-summary dark-panel">
        <div>
          제안 · 수요 참여현황 <span className="pill">진행중</span>
        </div>
        <div className="summary-boxes">
          <div>
            <small>이번 학기 내 관심</small>
            <b>
              {summary.data?.[0].items.length ?? "—"} <span>개 수업</span>
            </b>
          </div>
          <div>
            <small>일정 투표</small>
            <Link to="/my">
              {summary.data?.[1].items.length ?? "—"}개 진행중 →
            </Link>
          </div>
        </div>
        <Link className="button white" to="/proposals/new">
          + 새 수업 제안하기
        </Link>
      </section>
      <div className="listing-layout">
        <aside className="filter-sidebar">
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(q.trim());
            }}
          >
            <Icon name="search" size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="수업 검색"
              placeholder="듣고 싶은 수업 검색"
            />
            <button className="icon-button" aria-label="검색">
              ↵
            </button>
          </form>
          <div className="filter-section">
            <h3>상태</h3>
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
          </div>
          <div className="filter-section">
            <h3>분류</h3>
            <div className="chips">
              {[["", "전체"], ...Object.entries(categories)].map(([k, v]) => (
                <button
                  key={k}
                  className={`chip ${category === k ? "active" : ""}`}
                  aria-pressed={category === k}
                  onClick={() => setCategory(k)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <h3>대상 학년</h3>
            <select
              aria-label="학년"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">모든 학년</option>
              {[1, 2, 3].map((n) => (
                <option value={n} key={n}>
                  {n}학년
                </option>
              ))}
            </select>
          </div>
        </aside>
        <div className="listing-content">
          <div className="list-toolbar">
            <span>함께 만드는 수업</span>
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
          <Resource resource={r}>
            {(data) => (
              <>
                <div className="cards">
                  {[...data.items, ...extra].map((p) => (
                    <Card key={p.id} p={p} />
                  ))}
                </div>
                {!data.items.length && (
                  <p className="empty">조건에 맞는 수업이 없습니다.</p>
                )}
                {cursor !== "END" && data.nextCursor && (
                  <button
                    disabled={busy}
                    className="quiet load-more"
                    onClick={more}
                  >
                    더 보기
                  </button>
                )}
              </>
            )}
          </Resource>
          {error && <ErrorBox error={error} />}
        </div>
      </div>
    </section>
  );
}
export function Detail() {
  const { id } = useParams(),
    { user } = useContext(Auth),
    r = useResource(() => service.detail(id), [id]);
  return (
    <Resource resource={r}>
      {(p) => (
        <>
          <Link className="back" to="/">
            ‹ 수업제안 / {p.title}
          </Link>
          <div className="detail-layout">
            <article className="panel detail-main">
              <div className="detail-tags">
                <Tag status={p.status} />
                <span>
                  {categories[p.category]} · {p.targetGrades?.join("~")}학년
                </span>
              </div>
              <h1>{p.title}</h1>
              <p className="muted">
                제안자 {p.proposerName} · 희망 정원 {p.capacity || 20}명 ·{" "}
                {p.instructorType === "EXTERNAL" ? "외부 강사" : "교내 교사"}
              </p>
              <div className="facts">
                {[
                  ["수업 대상", `${p.targetGrades?.join("·")}학년`],
                  ["희망 정원", `${p.capacity || 20}명`],
                  [
                    "희망 강사",
                    p.instructorType === "EXTERNAL" ? "외부 강사" : "교내 교사",
                  ],
                  ["수업 시기", "학기 중 방과후"],
                ].map(([t, v]) => (
                  <div key={t}>
                    <small>{t}</small>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
              <h2>제안 사유</h2>
              <p className="preline">{p.description}</p>
              <h2>활동 계획</h2>
              <p className="preline">
                {p.activityPlan ||
                  "기초 개념을 함께 배우고, 실습과 프로젝트를 통해 배운 내용을 적용해요."}
              </p>
              {p.instructorName && (
                <>
                  <h2>희망 교사 추천 · 참고 링크</h2>
                  <p>{p.instructorName}</p>
                </>
              )}
            </article>
            <aside className="detail-aside">
              <section className="panel">
                <small>관심 수요</small>
                <div className="demand">
                  <strong>{p.interestCount}</strong>
                  <span>/ {p.threshold}명</span>
                  <Tag status={p.status} />
                </div>
                <Progress value={p.interestCount} max={p.threshold} />
                <p className="muted">
                  마감 {date(p.surveyDeadline || p.voteDeadline)}
                </p>
                {p.status === "VOTING" ? (
                  <>
                    <Link className="button block" to={`/proposals/${id}/vote`}>
                      일정 투표하기
                    </Link>
                    <Link className="text-link" to={`/proposals/${id}/result`}>
                      투표 결과 보기 →
                    </Link>
                  </>
                ) : p.status === "SURVEYING" ? (
                  <Interest
                    p={p}
                    user={user}
                    key={JSON.stringify(p.myInterest)}
                    reload={r.reload}
                  />
                ) : (
                  <p className="muted">
                    {p.status === "DRAFT"
                      ? "임시저장한 제안입니다. 공동제안자 동의 후 제출할 수 있습니다."
                      : "현재 관심 표시 기간이 아닙니다."}
                  </p>
                )}
              </section>
              <section className="panel">
                <h2>진행 단계</h2>
                <ol className="timeline">
                  <li>수업 제안 · 임시저장</li>
                  <li>공동제안 동의 · 제출</li>
                  <li>검토 · 수요조사</li>
                  <li>일정 투표</li>
                  <li>개설 확정 · 수강신청</li>
                </ol>
              </section>
            </aside>
          </div>
        </>
      )}
    </Resource>
  );
}
function Interest({ p, user, reload }) {
  const [intent, setIntent] = useState(p.myInterest?.intentLevel || 0),
    [comment, setComment] = useState(p.myInterest?.comment || ""),
    [open, setOpen] = useState(false),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  const eligible =
    user?.role === "STUDENT" &&
    p.targetGrades.includes(user.grade) &&
    new Date(p.surveyDeadline) > new Date();
  async function act(cancel = false) {
    setBusy(true);
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
    <>
      <button
        className="block"
        disabled={!eligible}
        onClick={() => setOpen(!open)}
      >
        ♡ {p.myInterest ? "관심 표시 수정" : "관심 표시하기"}
      </button>
      <p className="under-button">1인당 관심 표시 · 기간 내 수정 가능</p>
      {p.myInterest && (
        <p className="saved-label" role="status">
          ✓ 관심 표시가 저장되었습니다.
        </p>
      )}
      {open && (
        <form
          className="interest-form"
          onSubmit={(e) => {
            e.preventDefault();
            act();
          }}
        >
          <fieldset disabled={busy || !eligible}>
            <legend>참여 의향</legend>
            {[
              [1, "개설되면 반드시 신청"],
              [2, "시간이 맞으면 신청"],
              [3, "관심만 있어요"],
            ].map(([n, t]) => (
              <label className="choice" key={n}>
                <input
                  required
                  type="radio"
                  name="intent"
                  checked={intent === n}
                  onChange={() => setIntent(n)}
                />
                {t}
              </label>
            ))}
            <label className="field">
              의견 (선택)
              <textarea
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
            <button className="block" disabled={!intent}>
              {busy ? "저장 중…" : "관심 저장"}
            </button>
            {p.myInterest && (
              <button
                type="button"
                className="quiet block"
                onClick={() => act(true)}
              >
                관심 취소
              </button>
            )}
          </fieldset>
        </form>
      )}
      {!eligible && (
        <p className="muted">
          대상 학년의 학생만 수요조사 기간에 참여할 수 있습니다.
        </p>
      )}
      {error && <ErrorBox error={error} />}
    </>
  );
}
export function NewProposal() {
  const { user } = useContext(Auth),
    navigate = useNavigate();
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [category, setCategory] = useState("IT"),
    [grades, setGrades] = useState([1, 2]),
    [capacity, setCapacity] = useState(20),
    [instructorType, setInstructor] = useState("INTERNAL"),
    [similar, setSimilar] = useState(null);
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!grades.length) {
      setError(new Error("대상 학년을 선택해 주세요."));
      return;
    }
    setBusy(true);
    try {
      const p = await service.create({
        title: f.get("title").trim(),
        description: f.get("description").trim(),
        activityPlan: f.get("activityPlan"),
        category,
        targetGrades: grades,
        capacity,
        instructorType,
        instructorName: f.get("instructorName"),
        referenceUrl: f.get("referenceUrl"),
      });
      navigate(`/proposals/${p.id}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function check(e) {
    const title = e.target.value.trim();
    if (title.length < 2) {
      setSimilar(null);
      return;
    }
    try {
      setSimilar(await service.similar({ title }));
    } catch (e) {
      setError(e);
    }
  }
  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">2026학년도 2학기</p>
          <h1>새 수업 제안</h1>
          <p className="subtitle">
            함께 배우고 싶은 수업을 제안해주세요. 공동제안자 동의 후 제출할 수
            있습니다.
          </p>
        </div>
        <span className="tag">임시저장</span>
      </div>
      <form className="editor-layout" onSubmit={submit}>
        <div>
          <section className="panel">
            <h2>기본 정보</h2>
            <label className="field">
              수업명 <span className="required">*</span>
              <input
                aria-label="수업명"
                name="title"
                required
                maxLength={100}
                placeholder="예: 디스코드 봇 만들기 실습"
                onBlur={check}
              />
            </label>
            {similar?.items?.length > 0 && (
              <div className="warning">
                <b>ⓘ 비슷한 제안이 있어요.</b>
                <p>중복된 수업인지 확인해 주세요.</p>
                {similar.items.map((p) => (
                  <Link
                    key={p.id}
                    className="similar-link"
                    to={`/proposals/${p.id}`}
                  >
                    {p.title} →
                  </Link>
                ))}
              </div>
            )}
            <label className="field">분류</label>
            <div className="chips">
              {Object.entries(categories).map(([k, v]) => (
                <button
                  type="button"
                  className={`chip ${category === k ? "active" : ""}`}
                  onClick={() => setCategory(k)}
                  key={k}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="form-row">
              <fieldset>
                <legend>
                  대상 학년 <span className="required">*</span>
                </legend>
                <div className="grade-options">
                  {[1, 2, 3].map((n) => (
                    <label key={n}>
                      <input
                        type="checkbox"
                        checked={grades.includes(n)}
                        onChange={(e) =>
                          setGrades(
                            e.target.checked
                              ? [...grades, n]
                              : grades.filter((v) => v !== n),
                          )
                        }
                      />
                      {n}학년
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="field capacity">
                희망 정원 <span className="muted">(5~40명)</span>
                <div>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setCapacity((n) => Math.max(5, n - 1))}
                    aria-label="정원 줄이기"
                  >
                    −
                  </button>
                  <input
                    aria-label="희망 정원"
                    type="number"
                    min={5}
                    max={40}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setCapacity((n) => Math.min(40, n + 1))}
                    aria-label="정원 늘리기"
                  >
                    +
                  </button>
                </div>
              </label>
            </div>
          </section>
          <section className="panel">
            <h2>수업 내용</h2>
            <label className="field">
              제안 사유 <span className="required">*</span>
              <textarea
                aria-label="제안 사유"
                name="description"
                required
                minLength={10}
                maxLength={3000}
                placeholder="왜 이 수업이 필요한가요? 배우고 싶은 내용과 이유를 적어주세요."
              />
            </label>
            <label className="field">
              활동 계획 (선택)
              <textarea
                name="activityPlan"
                maxLength={3000}
                placeholder="예: 1~3주차 기초 문법, 4~6주차 미니 프로젝트"
              />
            </label>
          </section>
          <section className="panel">
            <h2>강사 추천</h2>
            <fieldset>
              <legend>희망 강사 유형</legend>
              <div className="segmented">
                {[
                  ["INTERNAL", "교내 교사"],
                  ["EXTERNAL", "외부 강사"],
                  ["ANY", "무관"],
                ].map(([v, t]) => (
                  <label
                    className={instructorType === v ? "selected" : ""}
                    key={v}
                  >
                    <input
                      type="radio"
                      checked={instructorType === v}
                      onChange={() => setInstructor(v)}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-row">
              <label className="field">
                추천하는 선생님 · 선택
                <input
                  name="instructorName"
                  placeholder="예: 정보 교과 선생님"
                />
              </label>
              <label className="field">
                참고 링크 · 선택
                <input name="referenceUrl" type="url" placeholder="https://" />
              </label>
            </div>
          </section>
        </div>
        <aside>
          <section className="panel co-proposers">
            <h2>
              공동제안자 <span>0 / 5</span>
            </h2>
            <p className="muted">
              친구 5명 이상의 동의를 모아 제출할 수 있어요.
            </p>
            <Progress value={0} max={5} />
            <div className="avatars">
              <span>나</span>
              <span>+</span>
              <span>+</span>
              <span>+</span>
              <span>+</span>
            </div>
            <p className="muted">
              먼저 임시저장한 뒤 공동제안자를 초대해 주세요.
            </p>
          </section>
          <section className="panel">
            <button
              className="block"
              disabled={busy || user?.role !== "STUDENT"}
            >
              {busy ? "저장 중…" : "임시저장"}
            </button>
            <p className="muted">
              공동제안 동의가 모이기 전까지 수정할 수 있습니다.
            </p>
            <Link className="quiet block" to="/">
              나가기
            </Link>
            {error && <ErrorBox error={error} />}
          </section>
        </aside>
      </form>
    </section>
  );
}
export function My() {
  const votes = useResource(() => service.list({ status: "VOTING" }));
  const r = useResource(() =>
    Promise.all([service.myInterests(), service.myProposals()]),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">마이페이지</p>
          <h1>내 수업</h1>
        </div>
      </div>
      <section className="my-section">
        <h2>일정 투표할 수업</h2>
        <Resource resource={votes}>
          {(data) =>
            data.items.length ? (
              <div className="cards">
                {data.items.map((p) => (
                  <Card key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <p className="empty">진행 중인 일정 투표가 없습니다.</p>
            )
          }
        </Resource>
      </section>
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
                  <p className="empty">아직 참여한 수업이 없습니다.</p>
                )}
              </section>
            ))}
          </>
        )}
      </Resource>
    </>
  );
}
export function Guide() {
  return (
    <section className="narrow">
      <div className="page-heading">
        <h1>이용 안내</h1>
      </div>
      {[
        [
          "01",
          "제안",
          "배우고 싶은 수업을 제안하고 공동제안자 5명 이상의 동의를 모아요.",
        ],
        ["02", "관심 표시", "대상 학년의 수업에 참여 의향과 의견을 남겨요."],
        [
          "03",
          "일정 투표",
          "참여 의향 1·2로 관심 표시한 학생은 후보 시간별 가능 여부를 투표해요.",
        ],
        ["04", "수강신청", "최종 개설된 수업을 확인하고 신청해요."],
      ].map(([n, t, d]) => (
        <section className="panel guide-step" key={n}>
          <b>{n}</b>
          <div>
            <h2>{t}</h2>
            <p>{d}</p>
          </div>
        </section>
      ))}
      <Link className="button" to="/">
        수업제안 둘러보기
      </Link>
    </section>
  );
}
