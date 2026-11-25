import { Link } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { service, demoMode, categories, enrollmentWindow } from "../lib/service";
import { isEnrollmentOpen } from "../lib/enrollmentSchedule";
import {
  Resource,
  useResource,
  ErrorBox,
  Icon,
  Logo,
  Progress,
  Auth,
  Tag,
  date,
} from "../ui";

export function ConfirmedCourses() {
  const { user } = useContext(Auth);
  const teacher = user?.role === "TEACHER";
  const courses = useResource(async () => {
    if (!teacher) return service.courses();
    const proposals = await loadTeacherQueue();
    return {
      items: proposals.filter(isConfirmedCourse),
    };
  }, [teacher]);
  const now = useEnrollmentClock();
  const status = isEnrollmentOpen(enrollmentWindow, now) ? "ENROLLING" : "CONFIRMED";
  return (
    <section className="enrollments-page course-catalog">
      <div className="page-heading course-catalog-heading">
        <div>
          <h1>개설 확정 수업</h1>
          <p className="subtitle">
            {teacher ? "내가 담당하는 방과후 수업을 모아 볼 수 있어요." : "방과후 수업의 내용과 운영 시간을 확인하세요."}
          </p>
        </div>
        {teacher ? (
          <Link className="button quiet" to="/teacher">선생님 화면으로</Link>
        ) : (
          <Link className={`button${status === "ENROLLING" ? "" : " quiet"}`} to="/enrollments">
            {status === "ENROLLING" ? "수강신청하기" : "수강신청 안내"}
          </Link>
        )}
      </div>
      <Resource resource={courses}>
        {({ items }) => (
          <div className="course-catalog-body">
            <div className="course-catalog-summary">
              <p>전체 <b>{items.length}</b>개</p>
              <Tag status={status} />
            </div>
            {items.length ? (
              <ul className="course-catalog-list" role="list" aria-label="개설 확정 수업 목록">
                {items.map((course) => (
                  <li className="course-catalog-row" key={course.id}>
                    <div className="course-catalog-description">
                      <p className="course-catalog-category">
                        {categories[course.category]}
                        {course.targetGrades?.length > 0 && ` · ${course.targetGrades.join("·")}학년`}
                      </p>
                      <h2><Link to={`/proposals/${course.id}`}>{course.title}</Link></h2>
                      <p>{course.description?.trim() || "등록된 수업 설명이 없습니다."}</p>
                    </div>
                    <dl className="course-catalog-facts">
                      <div>
                        <dt><Icon name="calendar" size={16} />운영 시간</dt>
                        <dd>{course.courseTime?.trim() || "미정"}</dd>
                      </div>
                      <div>
                        <dt><Icon name="user" size={16} />담당 선생님</dt>
                        <dd>{course.instructorName?.trim() || (teacher ? user.name : "미정")}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty course-catalog-empty">아직 개설이 확정된 수업이 없습니다.</p>
            )}
          </div>
        )}
      </Resource>
    </section>
  );
}

function useEnrollmentClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!enrollmentWindow) return;
    const refresh = () => setNow(Date.now());
    const next =
      now < enrollmentWindow.startsAt
        ? enrollmentWindow.startsAt
        : enrollmentWindow.endsAt;
    const delay = next > now ? Math.min(next - now, 60_000) : 60_000;
    const timer = window.setTimeout(refresh, delay);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [now]);
  return now;
}

export function Enrollments() {
  const now = useEnrollmentClock();
  if (isEnrollmentOpen(enrollmentWindow, now)) return <EnrollmentForm />;

  return (
    <section className="enrollments-page">
      <div className="page-heading">
        <h1>수강신청</h1>
      </div>
      <div className="panel enrollment-locked">
        <h2>
          {enrollmentWindow && now >= enrollmentWindow.endsAt
            ? "수강신청이 마감됐어요"
            : "아직 수강신청이 열리지 않았어요"}
        </h2>
        <p className="muted">
          {enrollmentWindow ? (
            <>
              신청일은 <time dateTime={enrollmentWindow.date}>{enrollmentWindow.date}</time> 하루입니다 (한국 시간).
            </>
          ) : "학교에서 수강신청 날짜를 정하면 이곳에 표시됩니다."}
        </p>
        <Link className="button" to="/courses">
          개설 확정 수업 보기
        </Link>
      </div>
    </section>
  );
}

function EnrollmentForm() {
  const r = useResource(() =>
      Promise.all([
        service.courses(),
        service.enrollments(),
        service.myInterests(),
      ]),
    ),
    [busy, setBusy] = useState(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(null);
  async function act(course, enrollment) {
    if (!isEnrollmentOpen(enrollmentWindow)) {
      setError("수강신청 기간에만 신청하거나 취소할 수 있습니다.");
      return;
    }
    setBusy(course.id);
    setError(null);
    setMessage("");
    try {
      if (enrollment) await service.cancelEnrollment(enrollment.id);
      else await service.enroll(course.id);
      setMessage(
        enrollment ? "수강신청을 취소했습니다." : "수강신청이 완료되었습니다.",
      );
      r.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="enrollments-page">
      <div className="page-heading">
        <div>
          <h1>수강신청</h1>
          <p className="subtitle">
            <time dateTime={enrollmentWindow.date}>{enrollmentWindow.date}</time> 하루 동안 신청할 수 있어요 (한국 시간).
          </p>
        </div>
        <Link className="button quiet" to="/courses">
          개설 확정 수업 보기
        </Link>
      </div>
      {demoMode && (
        <p className="info">
          체험 모드의 신청은 이 브라우저에만 저장됩니다. 실제 신청·정원·우선
          자격은 서버에서 확인해야 합니다.
        </p>
      )}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <Resource resource={r}>
        {([courses, enrollments, interests]) => (
          <>
            <div className="enrollment-layout">
              <div className="course-list">
                <div className="pin-heading">
                  <b>⌖ 관심 강좌 상단 고정</b>
                  <span>관심 표시한 수업을 먼저 보여드려요.</span>
                </div>
                {interests.items
                  .filter((p) => !courses.items.some((c) => c.id === p.id))
                  .map((p) => (
                    <article
                      className="panel pinned-waiting"
                      key={`waiting-${p.id}`}
                    >
                      <span className="pin-label">⌖ 관심 강좌</span>
                      <h2>{p.title}</h2>
                      <p className="muted">
                        아직 수강신청이 열리지 않았습니다. 개설되면 알림함에서
                        확인할 수 있어요.
                      </p>
                      <Link className="quiet" to={`/proposals/${p.id}`}>
                        {p.status === "VOTING" ? "일정 투표 확인" : "수업 확인"}{" "}
                        →
                      </Link>
                    </article>
                  ))}
                {[...courses.items]
                  .sort(
                    (a, b) =>
                      Number(interests.items.some((p) => p.id === b.id)) -
                      Number(interests.items.some((p) => p.id === a.id)),
                  )
                  .map((c) => {
                    const enrolled = enrollments.items.find(
                      (e) => e.proposalId === c.id,
                    );
                    return (
                      <article
                        className={`panel enrollment-card ${enrolled ? "enrolled" : ""}`}
                        key={c.id}
                      >
                        <div className="course-title">
                          <span className="category-icon">
                            <Icon
                              name={c.category === "IT" ? "code" : "calendar"}
                            />
                          </span>
                          <div>
                            <div className="card-meta">
                              {interests.items.some((p) => p.id === c.id) && (
                                <span className="pin-label">⌖ 관심 강좌</span>
                              )}
                              <span className="tag navy">수강신청</span>
                              <Tag status={c.status} />
                            </div>
                            <h2>{c.title}</h2>
                            <p className="muted">
                              {c.courseTime || "시간 확인 필요"} ·{" "}
                              {c.targetGrades?.join("~")}학년
                            </p>
                          </div>
                        </div>
                        <div className="course-capacity">
                          <span>
                            {c.enrollmentCount || 0}/{c.capacity}명
                          </span>
                          <Progress
                            value={c.enrollmentCount || 0}
                            max={c.capacity}
                          />
                        </div>
                        <button
                          className={enrolled ? "danger-outline" : ""}
                          disabled={
                            busy !== null ||
                            (!enrolled && c.canEnroll === false)
                          }
                          onClick={() => act(c, enrolled)}
                        >
                          {busy === c.id
                            ? "처리 중…"
                            : enrolled
                              ? "신청 취소"
                              : c.canEnroll === false
                                ? "신청 불가"
                                : "신청"}
                        </button>
                      </article>
                    );
                  })}
                {!courses.items.length && (
                  <p className="empty">수강신청 가능한 수업이 없습니다.</p>
                )}
              </div>
              <aside>
                <section className="panel">
                  <div className="mini-heading">
                    <h2>내 신청</h2>
                    <b>
                      {enrollments.items.length}
                      {demoMode ? "/2" : ""}
                    </b>
                  </div>
                  {demoMode && (
                    <Progress value={enrollments.items.length} max={2} />
                  )}
                  <div className="my-timetable">
                    {enrollments.items.length ? (
                      enrollments.items.map((e) => (
                        <div key={e.id}>
                          <small>신청 완료</small>
                          <b>{e.title}</b>
                        </div>
                      ))
                    ) : (
                      <p className="muted">아직 신청한 수업이 없습니다.</p>
                    )}
                  </div>
                </section>
                <section className="panel">
                  <h2>신청 안내</h2>
                  <p className="muted">
                    신청 기간 안에 취소할 수 있습니다.
                    <br />
                    시간이 겹치는 수업은 함께 신청할 수 없습니다.
                    <br />
                    확정 여부는 최종 안내를 확인하세요.
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
      </Resource>
      {error && <ErrorBox error={error} />}
    </section>
  );
}
function isConfirmedCourse({ status }) {
  return ["CONFIRMED", "ENROLLING", "RUNNING"].includes(status);
}

function teacherStage(proposal, now) {
  if (proposal.status === "SUBMITTED" || proposal.awaitingTeacher) return "접수 대기";
  if (isConfirmedCourse(proposal)) return "개설 확정";
  if (["REVIEWING", "VOTE_CLOSED"].includes(proposal.status)) return "일정 확정 대기";
  const deadline = proposal.voteDeadline ?? proposal.voteEndAt;
  return deadline && new Date(deadline).getTime() <= now
    ? "일정 확정 대기"
    : "투표 진행 중";
}

async function loadTeacherQueue() {
  const items = [];
  let cursor;
  do {
    const page = await service.teacherProposals({ cursor });
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return items.filter((proposal) =>
    proposal.status === "SUBMITTED" || proposal.awaitingTeacher ||
    isConfirmedCourse(proposal) ||
    (proposal.requiresInterest === false &&
      ["VOTING", "REVIEWING", "VOTE_CLOSED"].includes(proposal.status)),
  );
}

export function Teacher() {
  const { user, logout, switchDemo } = useContext(Auth);
  const queue = useResource(loadTeacherQueue);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="admin-layout teacher-layout">
      <aside className="admin-sidebar">
        <Logo kind="compact" />
        <h2>선생님 화면</h2>
        <p className="muted">{user.name}</p>
        <Link className="admin-selected" to="/teacher" aria-current="page">
          제안 접수 · 일정 확정
        </Link>
        <Link to="/courses">개설 확정 수업</Link>
        {demoMode && (
          <button className="quiet" onClick={() => switchDemo("STUDENT")}>
            학생 화면 체험
          </button>
        )}
        <button className="quiet" onClick={logout}>로그아웃</button>
        {demoMode && <p>체험 모드 · 변경 사항은 이 브라우저에 저장됩니다.</p>}
      </aside>
      <section className="admin-content">
        <div className="page-heading">
          <div>
            <h1>제안 접수 및 일정 확정</h1>
            <p className="subtitle">
              학생 제안을 맡아 일정 투표를 열고, 투표가 끝나면 수업 시간을 확정하세요.
            </p>
          </div>
        </div>
        {message && <p role="status" className="success">{message}</p>}
        <Resource resource={queue}>
          {(items) => {
            const current = items.find((proposal) => proposal.id === selected) ?? items[0];
            if (!current) {
              return <p className="empty">받을 수 있는 제안과 담당 중인 제안이 없습니다.</p>;
            }
            return (
              <div className="review-layout">
                <section className="review-queue" aria-label="제안 목록">
                  {items.map((proposal) => (
                    <button
                      type="button"
                      className={`review-item ${proposal.id === current.id ? "selected" : ""}`}
                      aria-pressed={proposal.id === current.id}
                      onClick={() => {
                        setSelected(proposal.id);
                        setMessage("");
                      }}
                      key={proposal.id}
                    >
                      <small>
                        {proposal.targetGrades?.join("·")}학년 · {categories[proposal.category]}
                      </small>
                      <strong>{proposal.title}</strong>
                      <span>{teacherStage(proposal, now)}</span>
                    </button>
                  ))}
                </section>
                <TeacherProposal
                  key={current.id}
                  proposal={current}
                  now={now}
                  onSaved={(updated, text) => {
                    setSelected(updated.id);
                    setMessage(text);
                    queue.reload();
                  }}
                />
              </div>
            );
          }}
        </Resource>
      </section>
    </div>
  );
}

function TeacherProposal({ proposal, now, onSaved }) {
  const deadline = proposal.voteDeadline ?? proposal.voteEndAt;
  const stage = teacherStage(proposal, now);
  return (
    <div className="teacher-proposal">
      <article className="panel">
        <span className={`tag ${proposal.status}`}>{stage}</span>
        <h2 className="review-title">{proposal.title}</h2>
        <p className="muted">
          제안자 {proposal.proposerName} · {proposal.targetGrades?.join("·")}학년 ·
          희망 정원 {proposal.capacity}명
        </p>
        <h3>제안 사유</h3>
        <p className="preline">{proposal.description}</p>
        {proposal.activityPlan && (
          <>
            <h3>활동 계획</h3>
            <p className="preline">{proposal.activityPlan}</p>
          </>
        )}
        <Link className="text-link" to={`/proposals/${proposal.id}`}>제안 상세 보기</Link>
      </article>
      {stage === "접수 대기" && <AcceptProposal proposal={proposal} onSaved={onSaved} />}
      {stage === "투표 진행 중" && (
        <section className="panel">
          <h2>일정 투표 진행 중</h2>
          <p>마감 {date(deadline)} (한국 시간)</p>
          <p className="muted">투표 마감 후 후보 시간 중 하나를 확정할 수 있습니다.</p>
          <CloseProposalVote proposal={proposal} onSaved={onSaved} />
        </section>
      )}
      {stage === "일정 확정 대기" && <ConfirmProposal proposal={proposal} onSaved={onSaved} />}
      {stage === "개설 확정" && (
        <section className="panel">
          <h2>확정된 수업 시간</h2>
          <p>{proposal.courseTime ?? proposal.schedule?.label ?? "미정"}</p>
          <Link className="text-link" to="/courses">개설 확정 수업 보기</Link>
        </section>
      )}
    </div>
  );
}

function CloseProposalVote({ proposal, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function close() {
    if (!window.confirm("지금 투표를 마감할까요? 이미 제출된 응답은 유지됩니다.")) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await service.closeProposalVote(proposal.id);
      onSaved(updated, "투표를 마감했습니다. 결과를 보고 운영 시간을 확정하세요.");
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="teacher-vote-actions">
        <Link className="button quiet" to={`/proposals/${proposal.id}/result`}>
          투표 응답 보기
        </Link>
        <button className="danger-outline" type="button" disabled={busy} onClick={close}>
          {busy ? "마감 중…" : "투표 마감"}
        </button>
      </div>
      {error && <ErrorBox error={error} />}
    </>
  );
}

function AcceptProposal({ proposal, onSaved }) {
  const slots = useResource(() => service.timeSlots());
  const [timeSlotIds, setTimeSlotIds] = useState([]);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const voteEndAt = new Date(`${deadline}+09:00`);
    if (!Number.isFinite(voteEndAt.getTime()) || voteEndAt.getTime() <= Date.now()) {
      setError("현재 시각보다 늦은 마감 일시를 선택해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await service.acceptProposal(proposal.id, {
        timeSlotIds,
        voteEndAt: voteEndAt.toISOString(),
      });
      onSaved(updated, "제안을 접수하고 대상 학년의 일정 투표를 열었습니다.");
    } catch (error) {
      setError(error);
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>제안 접수</h2>
      <p>제안을 맡으면 {proposal.targetGrades?.join("·")}학년 학생의 일정 투표가 바로 시작됩니다.</p>
      <Resource resource={slots}>
        {({ items }) => items.length ? (
          <form className="teacher-form" onSubmit={submit}>
            <fieldset disabled={busy}>
              <legend>투표 후보 시간</legend>
              <div className="teacher-slot-options">
                {items.map((slot) => {
                  const id = slot.timeSlotId ?? slot.id;
                  const selected = timeSlotIds.includes(id);
                  const label = slot.day && slot.endPeriod > slot.period
                    ? `${slot.day} ${slot.period}교시~${slot.endPeriod}교시`
                    : slot.label ?? slot.day;
                  return (
                    <label className="teacher-slot" key={id}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => setTimeSlotIds((previous) => selected
                          ? previous.filter((value) => value !== id)
                          : [...previous, id])}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <label className="field">
              투표 마감 일시 (한국 시간)
              <input
                type="datetime-local"
                required
                disabled={busy}
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </label>
            <button disabled={busy || !timeSlotIds.length || !deadline}>
              {busy ? "접수 중…" : "제안 맡고 투표 열기"}
            </button>
            {error && <ErrorBox error={error} />}
          </form>
        ) : <p className="empty">선택할 수 있는 후보 시간이 없습니다.</p>}
      </Resource>
    </section>
  );
}

function ConfirmProposal({ proposal, onSaved }) {
  const result = useResource(() => service.result(proposal.id), [proposal.id]);
  const [timeSlotId, setTimeSlotId] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await service.confirmProposal(proposal.id, { timeSlotId });
      onSaved(updated, "수업 시간과 개설을 확정했습니다.");
    } catch (error) {
      setError(error);
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>투표 결과 및 일정 확정</h2>
      <Resource resource={result}>
        {({ slots, totalRespondents }) => slots.some((slot) => slot.isActive !== false) ? (
          <form className="teacher-form" onSubmit={submit}>
            <p className="muted">총 {totalRespondents}명 응답 · 확정할 수업 시간을 선택하세요.</p>
            <fieldset disabled={busy}>
              <legend>후보별 응답</legend>
              <div className="teacher-slot-options">
                {slots.map((slot) => {
                  const id = slot.timeSlotId ?? slot.id;
                  return (
                    <label className="teacher-slot" key={id}>
                      <input
                        required
                        disabled={slot.isActive === false}
                        name="confirmed-slot"
                        type="radio"
                        checked={timeSlotId === id}
                        onChange={() => setTimeSlotId(id)}
                      />
                      <span>
                        <b>{slot.label ?? slot.day}</b>
                        <small>
                          가능 {slot.availableCount}명 · 조정 가능 {slot.adjustableCount}명 ·
                          불가 {slot.unavailableCount}명
                        </small>
                        {slot.isActive === false && <small>현재 선택할 수 없는 시간</small>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <button disabled={busy || timeSlotId == null}>
              {busy ? "확정 중…" : "일정 및 개설 확정"}
            </button>
            {error && <ErrorBox error={error} />}
          </form>
        ) : <p className="empty">현재 확정할 수 있는 후보 시간이 없습니다.</p>}
      </Resource>
    </section>
  );
}
