import { Link } from "react-router-dom";
import { useState, useContext } from "react";
import { service, demoMode, categories } from "../lib/service";
import {
  Resource,
  useResource,
  ErrorBox,
  Icon,
  Progress,
  Auth,
  Tag,
} from "../ui";
export function Enrollments() {
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
    setBusy(course.id);
    setError(null);
    setMessage("");
    try {
      if (enrollment) await service.cancelEnrollment(enrollment.id);
      else await service.enroll(course.id);
      setMessage(enrollment ? "수강신청을 취소했습니다." : "수강신청이 완료되었습니다.");
      r.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">개설 확정 수업 신청</p>
          <h1>수강신청</h1>
          <p className="subtitle">
            듣고 싶은 수업을 신청하세요. 신청 기간과 정원을 확인해 주세요.
          </p>
        </div>
      </div>
      {demoMode && (
        <p className="info">
          체험 모드의 신청은 이 브라우저에만 저장됩니다. 실제 신청·정원·우선
          자격은 서버에서 확인해야 합니다.
        </p>
      )}
      {message && <p className="success" role="status">{message}</p>}
      <Resource resource={r}>
        {([courses, enrollments, interests]) => (
          <>
            <section className="dark-panel enrollment-banner">
              <b>수강신청</b>
              <span>개설된 수업을 확인하고 신청해 주세요.</span>
            </section>
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
                    <h2>내 신청표</h2>
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
export function Admin() {
  const { user } = useContext(Auth);
  const list = useResource(() => service.reviewList()),
    [selected, setSelected] = useState(null),
    [message, setMessage] = useState("");
  const items = list.data?.items ?? [];
  const current = items.find((p) => p.id === selected)?.id ?? items[0]?.id;
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>방과후 관리</h2>
        <p className="muted">{user?.name}</p>
        <Link className="admin-selected" to="/admin" aria-current="page">
          제안 검토
        </Link>
        <Link to="/enrollments">개설 · 신청 확인</Link>
        <Link to="/">학생 화면으로</Link>
        {demoMode && (
          <p>
            관리자 화면 체험
            <br />
            실제 관리자 권한이 아닙니다.
          </p>
        )}
      </aside>
      <section className="admin-content" id="review">
        <div className="page-heading">
          <div>
            <p className="eyebrow">2026학년도 2학기 · 제안 접수 기간</p>
            <h1>제안 검토</h1>
          </div>
          <span className="tag">대기 {list.data?.items.length || 0}</span>
        </div>
        {message && (
          <p role="status" className="success">
            {message}
          </p>
        )}
        <Resource resource={list}>
          {(data) => (
            <div className="review-layout">
              <div className="review-queue">
                {data.items.map((p) => (
                  <button
                    className={`review-item ${p.id === current ? "selected" : ""}`}
                    aria-pressed={p.id === current}
                    onClick={() => {
                      setSelected(p.id);
                      setMessage("");
                    }}
                    key={p.id}
                  >
                    <small>
                      {p.targetGrades?.join("~")}학년 · {categories[p.category] || p.category}
                    </small>
                    <strong>{p.title}</strong>
                    <span>관심 {p.interestCount}명 · 검토 대기</span>
                  </button>
                ))}
                {!data.items.length && (
                  <p className="empty">검토할 제안이 없습니다.</p>
                )}
              </div>
              {current && (
                <Review
                  key={current}
                  id={current}
                  onSaved={() => {
                    setMessage("처리가 저장되었습니다.");
                    list.reload();
                  }}
                />
              )}
            </div>
          )}
        </Resource>
      </section>
    </div>
  );
}
function Review({ id, onSaved }) {
  const r = useResource(() => service.reviewDetail(id), [id]);
  return (
    <Resource resource={r}>
      {(data) => <ReviewForm data={data} id={id} onSaved={onSaved} />}
    </Resource>
  );
}
function ReviewForm({ data, id, onSaved }) {
  const p = data.proposal;
  const [action, setAction] = useState("APPROVE"),
    [threshold, setThreshold] = useState(p.threshold || 12),
    [deadline, setDeadline] = useState(""),
    [reason, setReason] = useState(""),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await service.review(id, {
        action,
        threshold: Number(threshold),
        surveyDeadline: deadline ? new Date(deadline).toISOString() : null,
        reason,
      });
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <article className="panel">
        <Tag status={p.status} />
        <h2 className="review-title">{p.title}</h2>
        <p className="muted">
          제안자 {p.proposerName} · {p.targetGrades?.join("~")}학년 · 희망 정원{" "}
          {p.capacity || 20}명
        </p>
        {data.similarProposals?.length > 0 && (
          <div className="warning">
            유사 제안 {data.similarProposals.length}건을 검토해 주세요.
          </div>
        )}
        <p>{p.description}</p>
        <div className="review-stats">
          <section>
            <h3>현재 관심 인원</h3>
            <Progress value={p.interestCount} max={p.threshold} />
            <b>{p.interestCount}명</b>
          </section>
          <section>
            <h3>담당 교사 의견</h3>
            <p>
              {data.teacherOpinion?.comment || "아직 등록된 의견이 없습니다."}
            </p>
          </section>
        </div>
      </article>
      <form className="panel review-form" onSubmit={submit}>
        <h2>처리</h2>
        <fieldset disabled={busy}>
          <div className="review-options">
            {[
              ["APPROVE", "승인"],
              ["REQUEST_CHANGES", "보완 요청"],
              ["HOLD", "보류"],
              ["REJECT", "반려"],
            ].map(([v, t]) => (
              <label className={action === v ? "selected" : ""} key={v}>
                <input
                  type="radio"
                  name="action"
                  checked={action === v}
                  onChange={() => setAction(v)}
                />
                {t}
              </label>
            ))}
          </div>
          {action === "APPROVE" && (
            <div className="form-row">
              <label className="field">
                개설 임계치 (유효 수요)
                <input
                  type="number"
                  min={1}
                  required
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </label>
              <label className="field">
                수요조사 종료일
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </label>
            </div>
          )}
          <label className="field">
            메모 {action !== "APPROVE" ? "(필수)" : "(선택)"}
            <textarea
              required={action !== "APPROVE"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="처리 사유를 입력해 주세요"
            />
          </label>
          <div className="form-actions">
            <button disabled={busy}>
              {busy
                ? "처리 중…"
                : action === "APPROVE"
                  ? "승인하고 수요조사 시작"
                  : "처리 저장"}
            </button>
          </div>
        </fieldset>
        {error && <ErrorBox error={error} />}
      </form>
    </div>
  );
}
