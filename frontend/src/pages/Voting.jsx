import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { service } from "../lib/service";
import {
  Resource,
  useResource,
  ErrorBox,
  Icon,
  Card,
  date,
  Progress,
} from "../ui";
const options = [
  ["AVAILABLE", "✓", "가능"],
  ["ADJUSTABLE", "△", "조정 가능"],
  ["UNAVAILABLE", "×", "불가"],
];
export function VoteList() {
  const r = useResource(() => service.list({ status: "VOTING" }));
  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">후보 일정에 투표해요</p>
          <h1>일정 투표</h1>
        </div>
      </div>
      <Resource resource={r}>
        {(data) => (
          <div className="cards">
            {data.items.map((p) => (
              <Card key={p.id} p={p} />
            ))}
            {!data.items.length && (
              <p className="empty">진행 중인 일정 투표가 없습니다.</p>
            )}
          </div>
        )}
      </Resource>
    </section>
  );
}
export function Vote() {
  const { id } = useParams(),
    r = useResource(
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
    [error, setError] = useState(null),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const closed = !v.deadline || new Date(v.deadline) <= now,
    allowed = v.canVote && !closed,
    answered = v.slots.filter((s) => answers[s.id]).length;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await service.submitVote(p.id, {
        responses: v.slots.map((s) => ({
          slotId: s.id,
          availability: answers[s.id],
        })),
      });
      setSaved(true);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="vote-page">
      <Link className="back" to={`/proposals/${p.id}`}>
        ‹ 수업제안 / {p.title} / 일정 투표
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">후보 일정에 투표해요</p>
          <h1>
            <span className="desktop-vote-title">{p.title}</span>
            <span className="mobile-vote-title">일정 투표</span>
          </h1>
          <p className="subtitle">
            가능한 모든 시간을 골라주세요. 기간 내에는 응답을 수정할 수
            있습니다.
          </p>
        </div>
      </div>
      <div className="mobile-course panel">
        <Icon name="calendar" />
        <div>
          <b>{p.title}</b>
          <small>마감 {date(v.deadline)}</small>
        </div>
      </div>
      <form
        className="vote-layout"
        onSubmit={submit}
        onChange={() => setSaved(false)}
      >
        <div className="panel vote-board">
          <div className="vote-tools">
            <span>
              <i className="legend available" />
              가능 <i className="legend adjustable" />
              조정 가능 <i className="legend unavailable" />
              불가
            </span>
            <button
              type="button"
              className="quiet"
              disabled={!allowed || busy}
              onClick={() => {
                setAnswers(
                  Object.fromEntries(v.slots.map((s) => [s.id, "AVAILABLE"])),
                );
                setSaved(false);
              }}
            >
              모두 가능
            </button>
          </div>
          <fieldset disabled={!allowed || busy}>
            <legend className="sr-only">후보 시간별 참여 가능 여부</legend>
            <div className="slots-grid">
              {v.slots.map((s) => (
                <fieldset className="slot" key={s.id}>
                  <legend>
                    {s.day}
                    <small>{s.period}교시</small>
                  </legend>
                  <div className="slot-choices">
                    {options.map(([value, symbol, label]) => (
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
                        <strong>{symbol}</strong>
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </fieldset>
          {!allowed && (
            <ErrorBox
              error={
                closed
                  ? "투표가 마감되었거나 아직 기간이 정해지지 않았습니다."
                  : "참여 의향 1·2로 관심 표시한 학생만 투표할 수 있습니다."
              }
            />
          )}
        </div>
        <aside>
          <section className="panel response-summary">
            <div className="mini-heading">
              <h2>내 응답</h2>
              <b>
                {answered}/{v.slots.length}
              </b>
            </div>
            <Progress value={answered} max={v.slots.length} />
            <button
              className="block"
              disabled={
                !allowed ||
                busy ||
                !v.slots.length ||
                answered !== v.slots.length
              }
            >
              {busy
                ? "제출 중…"
                : answered === v.slots.length
                  ? "투표 제출하기"
                  : "모든 시간을 응답해 주세요"}
            </button>
            {error && <ErrorBox error={error} />}
            {saved && (
              <p className="success" role="status">
                투표가 저장되었습니다.
              </p>
            )}
            <Link className="text-link" to={`/proposals/${p.id}/result`}>
              투표 결과 확인 →
            </Link>
          </section>
          <section className="panel voting-guide">
            <h2>투표 안내</h2>
            <p>
              가능: 수업에 참여할 수 있어요.
              <br />
              조정 가능: 일정을 조정하면 가능해요.
              <br />
              불가: 참여하기 어려워요.
            </p>
            <p className="muted">
              마감 {date(v.deadline)} (한국 시간)
              <br />
              최종 일정은 관리자가 결정합니다.
            </p>
          </section>
        </aside>
      </form>
    </section>
  );
}
export function Results() {
  const { id } = useParams(),
    r = useResource(
      () => Promise.all([service.detail(id), service.result(id)]),
      [id],
    );
  return (
    <Resource resource={r}>
      {([p, result]) => (
        <section className="results-page">
          <Link className="back" to={`/proposals/${id}`}>
            ‹ 투표 결과
          </Link>
          <div className="result-header">
            <div>
              <span className="tag CONFIRMED">응답 현황</span>
              <h1>{p.title}</h1>
              <p className="muted">요일 · 교시별 투표 현황을 확인하세요.</p>
            </div>
            <section className="dark-panel result-callout">
              <small>일정 투표 결과</small>
              <h2>{result.totalRespondents}명 응답</h2>
              <p>최종 일정은 관리자가 결정합니다.</p>
              <small>권고 일정과 개설 확정은 별도로 안내됩니다.</small>
            </section>
          </div>
          <div className="results-layout">
            <section className="panel">
              <h2>요일·교시별 참여 가능 인원</h2>
              <div className="result-heatmap">
                {result.slots.map((s) => (
                  <div key={s.id}>
                    <b>{s.day}</b>
                    <div
                      className={`heat-cell ${s.availableCount ? "has-votes" : ""}`}
                    >
                      <strong>{s.availableCount}명</strong>
                      <small>{s.period}교시 · 가능</small>
                    </div>
                  </div>
                ))}
              </div>
              <div className="heat-legend">
                <span>적음</span>
                <i />
                <i />
                <i />
                <i />
                <span>많음</span>
              </div>
              {!result.slots.length && (
                <p className="empty">아직 후보 시간이 없습니다.</p>
              )}
            </section>
            <aside>
              <section className="panel">
                <h2>요일별 결과</h2>
                {result.slots.map((s) => (
                  <div className="day-result" key={s.id}>
                    <div>
                      <b>
                        {s.day} {s.period}교시
                      </b>
                      <strong>{s.availableCount + s.adjustableCount}명</strong>
                    </div>
                    <div className="stacked-bar">
                      <span
                        style={{
                          width: `${(s.availableCount / (result.totalRespondents || 1)) * 100}%`,
                        }}
                      />
                      <i
                        style={{
                          width: `${(s.adjustableCount / (result.totalRespondents || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <small>
                      가능 {s.availableCount}명 · 조정 가능 {s.adjustableCount}
                      명 · 불가 {s.unavailableCount}명
                    </small>
                  </div>
                ))}
              </section>
              <Link className="button block" to="/enrollments">
                수강신청 화면 가기 →
              </Link>
              <div className="results-actions">
                <button className="quiet" onClick={r.reload}>
                  결과 새로고침
                </button>
                <Link to={`/proposals/${id}/vote`}>내 투표 수정</Link>
              </div>
            </aside>
          </div>
        </section>
      )}
    </Resource>
  );
}
