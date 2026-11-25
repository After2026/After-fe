import { useState, useEffect, useContext, useRef } from "react";
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

const listingStatuses = ["SURVEYING", "VOTING"];
const proposalSorts = [
  ["latest", "최신순"],
  ["deadline", "마감 임박순"],
  ["interest", "관심 인원순"],
];

export function Home() {
  const { user } = useContext(Auth);
  const summary = useResource(() =>
    Promise.all([service.myInterests(), service.myProposals()]),
  );
  const [q, setQ] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [selectedStatuses, setStatuses] = useState([]),
    [selectedGrades, setGrades] = useState([]),
    [sort, setSort] = useState("latest");
  const [interests, proposals] = summary.data ?? [];
  const filters = {
    q: query,
    category,
    statuses: selectedStatuses,
    grades: selectedGrades,
    sort,
  };

  useEffect(() => {
    const timer = setTimeout(() => setQuery(q.trim()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  function statusOption(key) {
    return (
      <label key={key} className="filter-check">
        <input
          type="checkbox"
          checked={selectedStatuses.includes(key)}
          onChange={() => setStatuses((values) => toggleFilter(values, key))}
        />
        {statuses[key]}
      </label>
    );
  }

  return (
    <section className="listing-page">
      <div className="page-heading">
        <div>
          {demoMode && (
            <p className="listing-term">2026학년도 2학기 · 제안 접수</p>
          )}
          <h1>수업 제안</h1>
        </div>
        <div className="listing-actions">
          {summary.data && (
            <Link className="listing-activity" to="/my">
              관심 표시 <b>{interests.items.length}</b>건 · 이번 학기 제안{" "}
              <b>{proposals.items.length}</b>건
            </Link>
          )}
          <Link className="button listing-create" to="/proposals/new">
            <Icon name="plus" />새 수업 제안하기
          </Link>
        </div>
      </div>
      <div className="listing-layout">
        <aside className="filter-sidebar" aria-label="수업 필터">
          <form
            className="search"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(q.trim());
            }}
          >
            <Icon name="search" size={18} />
            <input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                if (!event.target.value) setQuery("");
              }}
              aria-label="수업 검색"
              type="search"
              placeholder="수업명·내용 검색"
            />
          </form>
          <fieldset className="filter-section">
            <legend className="filter-label">상태</legend>
            {listingStatuses.map(statusOption)}
          </fieldset>
          <fieldset className="filter-section">
            <legend className="filter-label">분류</legend>
            <div className="chips">
              {[["", "전체"], ...Object.entries(categories)].map(
                ([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`chip ${category === key ? "active" : ""}`}
                    aria-pressed={category === key}
                    onClick={() => setCategory(key)}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </fieldset>
          <fieldset className="filter-section">
            <legend className="filter-label">대상 학년</legend>
            {[1, 2, 3].map((year) => (
              <label key={year} className="filter-check">
                <input
                  type="checkbox"
                  checked={selectedGrades.includes(year)}
                  onChange={() =>
                    setGrades((values) => toggleFilter(values, year))
                  }
                />
                {year}학년{year === user?.grade ? " (내 학년)" : ""}
              </label>
            ))}
          </fieldset>
        </aside>
        <section className="listing-content" aria-label="제안 목록">
          <ProposalList
            key={JSON.stringify([
              query,
              category,
              selectedStatuses,
              selectedGrades,
            ])}
            filters={filters}
            interests={interests?.items ?? []}
            setSort={setSort}
          />
        </section>
      </div>
    </section>
  );
}

function toggleFilter(values, key) {
  return values.includes(key)
    ? values.filter((value) => value !== key)
    : [...values, key];
}

async function loadProposalPage({ statuses, grades, ...filters }, cursor) {
  const seenCursors = new Set();
  while (true) {
    seenCursors.add(cursor);
    const result = await service.list({
      ...filters,
      status: statuses.length === 1 ? statuses[0] : "",
      grade: grades.length === 1 ? grades[0] : "",
      cursor,
    });
    const items = result.items.filter(
      (proposal) =>
        listingStatuses.includes(proposal.status) &&
        (!statuses.length || statuses.includes(proposal.status)) &&
        (!grades.length ||
          proposal.targetGrades?.some((grade) => grades.includes(grade))),
    );
    const nextCursor = seenCursors.has(result.nextCursor)
      ? null
      : result.nextCursor;
    if (items.length || !nextCursor) return { items, nextCursor };
    cursor = nextCursor;
  }
}

function ProposalList({ filters, interests, setSort }) {
  const { user } = useContext(Auth);
  const r = useResource(() => loadProposalPage(filters), [filters.sort]);
  const [page, setPage] = useState(null);
  const [loadingSort, setLoadingSort] = useState(null);
  const [error, setError] = useState(null);
  const nextCursor = page ? page.nextCursor : r.data?.nextCursor;
  const interestedIds = new Set(interests.map(({ id }) => String(id)));
  const loaded = [...(r.data?.items ?? []), ...(page?.items ?? [])];

  function sort(value) {
    if (value === filters.sort) return;
    setPage(null);
    setError(null);
    setSort(value);
  }

  async function more() {
    setLoadingSort(filters.sort);
    setError(null);
    try {
      const result = await loadProposalPage(filters, nextCursor);
      setPage((previous) => ({
        items: [...(previous?.items ?? []), ...result.items],
        nextCursor: result.nextCursor,
      }));
    } catch (error) {
      setError(error);
    } finally {
      setLoadingSort(null);
    }
  }

  return (
    <>
      <div className="list-toolbar">
        <p className="listing-count" role="status">
          표시 중 <b>{loaded.length}</b>건
        </p>
        <div className="listing-sort" role="group" aria-label="정렬">
          {proposalSorts.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filters.sort === value}
              disabled={loadingSort !== null}
              onClick={() => sort(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Resource resource={r}>
        {() =>
          loaded.length ? (
            <>
              <div className="cards">
                {loaded.map((p) => (
                  <Card
                    key={p.id}
                    p={p}
                    listing
                    ownProposal={isProposalOwner(p, user)}
                    interested={interestedIds.has(String(p.id))}
                  />
                ))}
              </div>
              {nextCursor && (
                <button
                  disabled={loadingSort !== null}
                  className="quiet load-more"
                  onClick={more}
                >
                  {loadingSort !== null ? "불러오는 중…" : "더 보기"}
                </button>
              )}
              {error && <ErrorBox error={error} />}
            </>
          ) : (
            <p className="empty">조건에 맞는 수업이 없습니다.</p>
          )
        }
      </Resource>
    </>
  );
}

const proposalStages = [
  ["수업 제안", ["DRAFT"]],
  [
    "선생님 접수",
    ["SUBMITTED", "REVIEWING", "SURVEYING", "ON_HOLD", "REJECTED", "BELOW_THRESHOLD"],
  ],
  ["일정 투표", ["VOTING"]],
  ["개설 확정 · 수강신청", ["CONFIRMED", "ENROLLING", "RUNNING"]],
];

function proposalReference(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    return null;
  }
  return null;
}

function isProposalOwner(proposal, user) {
  if (user?.role !== "STUDENT") return false;
  return proposal.proposerId == null
    ? demoMode && proposal.proposerName === user.name
    : proposal.proposerId === user.id;
}

function canEditProposal(proposal, user) {
  return isProposalOwner(proposal, user) && (
    proposal.canEdit ?? (
      ["DRAFT", "SUBMITTED", "SURVEYING"].includes(proposal.status) &&
      !proposal.voteStartAt && !proposal.voteDeadline
    )
  );
}

function ProposalOwnerActions({ proposal, user }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const canEdit = canEditProposal(proposal, user);
  const canDelete = isProposalOwner(proposal, user) && (
    proposal.canDelete ?? (canEdit || (proposal.status === "REJECTED" && !proposal.voteDeadline))
  );
  if (!canEdit && !canDelete) return null;

  async function remove() {
    if (!window.confirm("이 수업 제안을 삭제할까요? 삭제하면 목록에서 사라집니다.")) return;
    setBusy(true);
    setError(null);
    try {
      await service.deleteProposal(proposal.id);
      navigate("/my", { replace: true });
    } catch (error) {
      setError(error);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="proposal-owner-actions">
        {canEdit && (
          <Link className="button quiet" to={`/proposals/${proposal.id}/edit`}>수정하기</Link>
        )}
        {canDelete && (
          <button className="danger-outline" type="button" disabled={busy} onClick={remove}>
            {busy ? "삭제 중…" : "삭제하기"}
          </button>
        )}
      </div>
      {error && <ErrorBox error={error} />}
    </div>
  );
}

export function Detail() {
  const { id } = useParams(),
    { user } = useContext(Auth),
    r = useResource(() => service.detail(id), [id]);
  return (
    <Resource resource={r}>
      {(p) => {
        const reference = proposalReference(p.referenceUrl);
        const teacherVote = p.requiresInterest === false || p.responsibleTeacherId != null;
        const awaitingConfirmation = teacherVote && p.status === "REVIEWING";
        const showVote = p.status === "VOTING" || awaitingConfirmation;
        const deadline =
          showVote ? p.voteDeadline : p.surveyDeadline;
        const legacySurvey = !p.awaitingTeacher && (
          p.status === "SURVEYING" || (p.status === "VOTING" && !teacherVote)
        );
        const ownProposal = isProposalOwner(p, user);
        const canSubmit = p.status === "DRAFT" && ownProposal;
        const voteOpen = p.status === "VOTING" && deadline && new Date(deadline).getTime() > Date.now();
        const canVote = user?.role === "STUDENT" && p.targetGrades?.includes(user.grade) && voteOpen;
        const recommendedTeacher = p.recommendedTeacher ?? (p.status === "DRAFT" ? p.instructorName : null);
        return (
          <section className="proposal-detail">
            <Link className="back" to="/">
              ‹ 수업제안 / {p.title}
            </Link>
            <div className="detail-layout">
              <article className="panel detail-main">
                <div className="detail-tags">
                  <Tag status={p.status} />
                  {ownProposal && <span className="tag proposal-owner-badge">내 제안</span>}
                  <span>
                    {categories[p.category]} · {p.targetGrades?.join("~")}학년
                  </span>
                </div>
                <h1>{p.title}</h1>
                <p className="muted">
                  제안자 {p.proposerName} · 희망 정원 {p.capacity || 20}명 ·{" "}
                  {instructorTypeLabel[p.instructorType] ?? "교내 교사"}
                </p>
                <div className="facts">
                  {[
                    ["수업 대상", `${p.targetGrades?.join("·")}학년`],
                    ["희망 정원", `${p.capacity || 20}명`],
                    [
                      "희망 강사",
                      instructorTypeLabel[p.instructorType] ?? "교내 교사",
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
                <h2>기대 활동 내용</h2>
                <p className="preline">
                  {p.activityPlan || "등록된 활동 계획이 없습니다."}
                </p>
                {(recommendedTeacher || reference) && (
                  <>
                    <h2>희망 교사 추천 · 참고 링크</h2>
                    {recommendedTeacher && <p>{recommendedTeacher}</p>}
                    {reference && (
                      <a
                        className="quiet button"
                        href={reference}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        참고 자료 열기
                      </a>
                    )}
                  </>
                )}
              </article>
              <aside className="detail-aside">
                <section className="panel">
                  <div className="mini-heading">
                    <h2>{legacySurvey ? "관심 수요" : "제안 현황"}</h2>
                    <ProposalOwnerActions key={p.id} proposal={p} user={user} />
                  </div>
                  {legacySurvey && (
                    <>
                      <div className="demand">
                        <strong>{p.interestCount}</strong>
                        <span>/ {p.threshold}명</span>
                        <Tag status={p.status} />
                      </div>
                      <Progress value={p.interestCount} max={p.threshold} />
                    </>
                  )}
                  {!legacySurvey && (
                    <>
                      <Progress value={p.interestCount} max={p.capacity} />
                      <p className="muted">관심 {p.interestCount}명</p>
                    </>
                  )}
                  {(showVote || p.status === "SURVEYING") && deadline && (
                    <p className="muted">마감 {date(deadline)} (한국 시간)</p>
                  )}
                  {showVote ? (
                    <>
                      {teacherVote && (
                        <p>
                          {voteOpen
                            ? "대상 학년 학생이 일정 투표에 참여할 수 있어요."
                            : "투표가 마감됐어요. 담당 선생님이 수업 시간을 확정해요."}
                        </p>
                      )}
                      <div className="detail-vote-actions">
                        {canVote && (
                          <Link className="button detail-vote-button" to={`/proposals/${id}/vote`}>
                            일정 투표하기
                          </Link>
                        )}
                        <Link
                          className="text-link"
                          to={`/proposals/${id}/result`}
                        >
                          투표 결과 보기 →
                        </Link>
                      </div>
                    </>
                  ) : p.status === "SURVEYING" ? (
                    <>
                      {p.awaitingTeacher && (
                        <p>선생님이 제안을 맡으면 대상 학년의 일정 투표가 시작돼요.</p>
                      )}
                      {ownProposal ? (
                        <p className="muted">내가 올린 제안에는 관심을 표시할 수 없어요.</p>
                      ) : (
                        <Interest
                          p={p}
                          user={user}
                          key={JSON.stringify(p.myInterest)}
                          reload={r.reload}
                        />
                      )}
                    </>
                  ) : canSubmit ? (
                    <SubmitProposal key={p.id} proposal={p} reload={r.reload} />
                  ) : p.status === "SUBMITTED" ? (
                    <p className="muted">선생님이 제안을 맡으면 대상 학년의 일정 투표가 시작됩니다.</p>
                  ) : p.courseTime ? (
                    <>
                      <p>확정된 수업 시간 {p.courseTime}</p>
                      {teacherVote && (
                        <Link className="text-link" to={`/proposals/${id}/result`}>
                          투표 결과 보기 →
                        </Link>
                      )}
                    </>
                  ) : p.status === "DRAFT" ? (
                    <p className="muted">
                      아직 제출하지 않은 제안입니다.
                    </p>
                  ) : <Tag status={p.status} />}
                </section>
                <section className="panel">
                  <h2>진행 단계</h2>
                  <ol className="timeline">
                    {proposalStages.map(([label, values]) => (
                      <li
                        key={label}
                        aria-current={
                          values.includes(awaitingConfirmation ? "VOTING" : p.status) ? "step" : undefined
                        }
                      >
                        {label}
                      </li>
                    ))}
                  </ol>
                </section>
              </aside>
            </div>
          </section>
        );
      }}
    </Resource>
  );
}
const instructorTypeLabel = { INTERNAL: "교내 교사", EXTERNAL: "외부 강사", ANY: "무관" };

function SubmitProposal({ proposal, reload }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await service.submitProposal(proposal.id);
      reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="proposal-submit">
      <button className="block" disabled={busy} onClick={submit}>
        {busy ? "제출 중…" : "선생님에게 제출하기"}
      </button>
      {error && <ErrorBox error={error} />}
    </div>
  );
}

function Interest({ p, user, reload }) {
  const [intent, setIntent] = useState(p.myInterest?.intentLevel || 0),
    [comment, setComment] = useState(p.myInterest?.comment || ""),
    [open, setOpen] = useState(false),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    if (open && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [open]);
  const eligible =
    user?.role === "STUDENT" &&
    p.targetGrades.includes(user.grade) &&
    (p.awaitingTeacher || Date.parse(p.surveyDeadline) > Date.now());
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
        type="button"
        disabled={!eligible}
        aria-expanded={open}
        aria-controls={open ? "interest-form" : undefined}
        onClick={() => setOpen(!open)}
      >
        ♡ {p.myInterest ? "관심 표시 수정" : "관심 표시하기"}
      </button>
      <p className="under-button">
        {p.awaitingTeacher ? "일정 투표가 열리기 전까지 수정할 수 있어요." : "1인당 관심 표시 · 기간 내 수정 가능"}
      </p>
      {p.myInterest && (
        <p className="saved-label" role="status">
          ✓ 관심 표시가 저장되었습니다.
        </p>
      )}
      {open && (
        <dialog
          className="interest-dialog"
          ref={dialog}
          aria-labelledby="interest-title"
          onClose={() => setOpen(false)}
        >
          <h2 id="interest-title">얼마나 듣고 싶나요?</h2>
          <form
            className="interest-form"
            id="interest-form"
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
              <div className="form-actions">
                <button
                  type="button"
                  className="quiet"
                  onClick={() => dialog.current.close()}
                >
                  닫기
                </button>
                <button disabled={!intent}>
                  {busy ? "저장 중…" : "관심 저장"}
                </button>
              </div>
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
          {error && <ErrorBox error={error} />}
        </dialog>
      )}
      {!eligible && (
        <p className="muted">
          대상 학년의 학생만 수요조사 기간에 참여할 수 있습니다.
        </p>
      )}
      {error && !open && <ErrorBox error={error} />}
    </>
  );
}
export function NewProposal() {
  return <ProposalForm />;
}

export function EditProposal() {
  const { id } = useParams();
  const { user } = useContext(Auth);
  const proposal = useResource(() => service.detail(id), [id]);
  return (
    <Resource resource={proposal}>
      {(p) => canEditProposal(p, user) ? (
        <ProposalForm key={p.id} proposal={p} />
      ) : (
        <section className="panel">
          <ErrorBox error="일정 투표가 열리기 전까지 제안자만 수정할 수 있습니다." />
          <Link className="button quiet" to={`/proposals/${id}`}>제안 상세로 돌아가기</Link>
        </section>
      )}
    </Resource>
  );
}

function ProposalForm({ proposal }) {
  const { user } = useContext(Auth),
    navigate = useNavigate();
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [category, setCategory] = useState(proposal?.category ?? "IT"),
    [grades, setGrades] = useState(proposal?.targetGrades ?? [1, 2]),
    [capacity, setCapacity] = useState(proposal?.capacity ?? 20),
    [instructorType, setInstructor] = useState(proposal?.instructorType ?? "INTERNAL"),
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
      const fields = {
        title: f.get("title").trim(),
        description: f.get("description").trim(),
        activityPlan: f.get("activityPlan").trim(),
        category,
        targetGrades: grades,
        capacity,
        instructorType,
        instructorName: f.get("instructorName"),
        referenceUrl: f.get("referenceUrl"),
      };
      const p = proposal
        ? await service.updateProposal(proposal.id, {
            ...fields,
            semesterId: proposal.semesterId,
            equipment: proposal.equipment,
            referenceLinks: proposal.referenceLinks,
          })
        : await service.create({ ...fields, publishForSurvey: true });
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
    <section className="proposal-editor">
      <div className="page-heading">
        <div>
          {!proposal && <p className="eyebrow">2026학년도 2학기</p>}
          <h1>{proposal ? "수업 제안 수정" : "새 수업 제안"}</h1>
          <p className="subtitle">
            {proposal ? "일정 투표가 열리기 전까지 내용을 수정할 수 있어요." : "제안을 올리면 바로 수요조사가 시작돼요."}
          </p>
        </div>
      </div>
      <form
        className={proposal ? "editor-layout" : "editor-layout new-proposal-layout"}
        onSubmit={submit}
      >
        <div>
          <section className="panel">
            <h2>기본 정보</h2>
            <label className="field">
              수업명 <span className="required">*</span>
              <input
                aria-label="수업명"
                name="title"
                required
                minLength={2}
                maxLength={30}
                placeholder="예: 디스코드 봇 만들기 실습"
                defaultValue={proposal?.title}
                onBlur={proposal ? undefined : check}
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
                defaultValue={proposal?.description}
                required
                minLength={demoMode ? 10 : 30}
                maxLength={500}
                placeholder="왜 이 수업이 필요한가요? 배우고 싶은 내용과 이유를 적어주세요."
              />
            </label>
            <label className="field">
              활동 계획 {demoMode ? "(선택)" : <span className="required">*</span>}
              <textarea
                name="activityPlan"
                defaultValue={proposal?.activityPlan}
                required={!demoMode}
                minLength={demoMode ? undefined : 30}
                maxLength={1000}
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
                  defaultValue={proposal?.recommendedTeacher ?? proposal?.instructorName}
                  maxLength={100}
                  placeholder="예: 정보 교과 선생님"
                />
              </label>
              <label className="field">
                참고 링크 · 선택
                <input name="referenceUrl" type="url" defaultValue={proposal?.referenceUrl} placeholder="https://" />
              </label>
            </div>
          </section>
        </div>
        <aside>
          <section className="panel">
            <button
              className="proposal-editor-submit"
              disabled={busy || user?.role !== "STUDENT"}
            >
              {proposal ? (busy ? "저장 중…" : "변경사항 저장") : (busy ? "제안 올리는 중…" : "제안 올리기")}
            </button>
            {!proposal && <p className="muted">대상 학년 학생이 수요조사에 참여할 수 있어요.</p>}
            <Link className="quiet block" to={proposal ? `/proposals/${proposal.id}` : "/"}>
              {proposal ? "취소" : "나가기"}
            </Link>
            {error && <ErrorBox error={error} />}
          </section>
        </aside>
      </form>
    </section>
  );
}
async function loadVotableProposals() {
  const items = [];
  let cursor;
  do {
    const page = await service.votableProposals({ cursor });
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return { items };
}

export function My() {
  const { user } = useContext(Auth);
  const votes = useResource(loadVotableProposals);
  const r = useResource(() =>
    Promise.all([service.myInterests(), service.myProposals()]),
  );
  const enrollment = useResource(() => service.enrollments());
  return (
    <section className="activity-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {user?.grade
              ? `${user.grade}학년${user.classNumber ? ` ${user.classNumber}반` : ""}`
              : "마이페이지"}
          </p>
          <h1>내 활동</h1>
        </div>
      </div>
      <div className="activity-layout">
        <div className="activity-main">
          <section className="panel activity-todo" aria-label="해야 할 일">
            <h2>일정 투표할 수업</h2>
            <Resource resource={votes}>
              {({ items }) =>
                items.length ? (
                  items.map((proposal) => (
                    <div className="activity-row" key={proposal.id}>
                      <div>
                        <Tag status={proposal.status} />
                        <h3>{proposal.title}</h3>
                        {proposal.voteDeadline && (
                          <small>마감 {date(proposal.voteDeadline)}</small>
                        )}
                      </div>
                      <Link
                        className="button"
                        to={`/proposals/${proposal.id}/vote`}
                      >
                        투표하기
                      </Link>
                    </div>
                  ))
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
                  [proposals, "내 제안"],
                ].map(([data, title]) => (
                  <section className="panel activity-group" key={title}>
                    <h2>
                      {title} <small>{data.items.length}건</small>
                    </h2>
                    {data.items.length ? (
                      data.items.map((p) => (
                        <Link
                          className="activity-row"
                          to={`/proposals/${p.id}`}
                          key={p.id}
                        >
                          <div>
                            <h3>{p.title}</h3>
                            <small>
                              {categories[p.category]} ·{" "}
                              {p.targetGrades?.join(", ")}학년
                            </small>
                          </div>
                          <Tag status={p.status} />
                        </Link>
                      ))
                    ) : (
                      <p className="empty">아직 등록된 수업이 없습니다.</p>
                    )}
                  </section>
                ))}
              </>
            )}
          </Resource>
        </div>
        <aside className="activity-aside">
          <section className="panel">
            <h2>수강신청 · 신청한 강좌</h2>
            <Resource resource={enrollment}>
              {({ items }) =>
                items.length ? (
                  <ul className="activity-enrollments">
                    {items.map(({ id, title }) => (
                      <li key={id}>{title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">아직 신청한 수업이 없습니다.</p>
                )
              }
            </Resource>
            <Link className="button quiet" to="/enrollments">
              수강신청으로 이동
            </Link>
          </section>
          <Link className="button quiet" to="/notifications">
            알림함 열기
          </Link>
        </aside>
      </div>
    </section>
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
          "배우고 싶은 수업을 제안하면 바로 수요조사가 시작돼요.",
        ],
        ["02", "선생님 접수", "학교 선생님이 제안을 맡고 투표 후보 시간과 마감 일시를 정해요."],
        [
          "03",
          "일정 투표",
          "대상 학년 학생이 후보 시간마다 참여할 수 있는지 투표해요.",
        ],
        ["04", "개설 확정 · 수강신청", "투표가 마감되면 담당 선생님이 시간을 확정해요. 개설된 수업을 확인하고 신청해요."],
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
