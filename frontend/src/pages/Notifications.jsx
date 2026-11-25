import { useState, useEffect, useContext } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { service, demoMode } from "../lib/service";
import { Auth, Icon, Resource, useResource, ErrorBox, date } from "../ui";
export function NotificationsBell() {
  const { user } = useContext(Auth),
    location = useLocation();
  const [count, setCount] = useState(0),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true,
      pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const data = await service.unreadCount();
        if (active) {
          setCount(data.count);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      } finally {
        pending = false;
      }
    }
    if (!user) return;
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("after:data-change", refresh);
    window.addEventListener("after:notifications-read", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("after:data-change", refresh);
      window.removeEventListener("after:notifications-read", refresh);
    };
  }, [user?.id, location.pathname]);
  return (
    <NavLink
      to="/notifications"
      className="notification-bell"
      aria-label={
        error
          ? "알림함 (새 알림 수 확인 실패)"
          : `알림함${count ? ` · 읽지 않은 알림 ${count}개` : ""}`
      }
    >
      <Icon name="bell" />
      {count > 0 && <span>{count > 99 ? "99+" : count}</span>}
    </NavLink>
  );
}
export function Notifications() {
  const [cursor, setCursor] = useState(null),
    [history, setHistory] = useState([]),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);
  const r = useResource(() => service.notifications({ cursor }), [cursor]);
  const interests = useResource(() => service.myInterests());
  useEffect(() => {
    const refresh = () => r.reload();
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [cursor]);
  async function read(id) {
    setBusy(true);
    try {
      if (id === undefined) await service.readAllNotifications();
      else await service.readNotification(id);
      setError(null);
      window.dispatchEvent(new Event("after:notifications-read"));
      r.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="notifications-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">관심 수업 소식</p>
          <h1>알림함</h1>
        </div>
        <button className="quiet" onClick={() => read()} disabled={busy}>
          모두 읽음
        </button>
      </div>
      {demoMode && (
        <p className="info">
          체험 모드에서는 저장된 관심 수업이 개설 상태가 되면 알림을 만듭니다.
          실제 서버 개설 알림과 앱 종료 후 푸시는 연결되지 않았습니다.
        </p>
      )}
      <div className="notifications-layout">
        <section className="notification-feed" aria-label="알림 목록">
          <Resource resource={r}>
            {(data) => (
              <>
                {data.items.length ? (
                  data.items.map((n) => (
                    <article
                      className={`panel notification-item ${n.read ? "" : "unread"}`}
                      key={n.id}
                    >
                      <div>
                        <span className="tag">
                          {n.read ? "읽음" : "새 알림"}
                        </span>
                        <h2>{n.title}</h2>
                        <p>{n.message}</p>
                        <small className="muted">{date(n.createdAt)}</small>
                      </div>
                      <div className="notification-actions">
                        {n.proposalId && (
                          <Link
                            className="button"
                            to={`/proposals/${n.proposalId}`}
                          >
                            수업 확인
                          </Link>
                        )}
                        {!n.read && (
                          <button
                            className="quiet"
                            onClick={() => read(n.id)}
                            disabled={busy}
                          >
                            읽음 처리
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="panel empty">
                    아직 알림이 없습니다. 관심을 표시한 수업이 개설되면
                    알려드릴게요.
                  </div>
                )}
                <div className="form-actions">
                  {history.length > 0 && (
                    <button
                      className="quiet"
                      onClick={() => {
                        setCursor(history.at(-1));
                        setHistory((v) => v.slice(0, -1));
                      }}
                    >
                      이전
                    </button>
                  )}
                  {data.nextCursor && (
                    <button
                      className="quiet"
                      onClick={() => {
                        setHistory((v) => [...v, cursor]);
                        setCursor(data.nextCursor);
                      }}
                    >
                      다음
                    </button>
                  )}
                </div>
              </>
            )}
          </Resource>
        </section>
        <aside className="notification-aside">
          <section className="panel">
            <h2>기다리는 강좌</h2>
            <Resource resource={interests}>
              {({ items }) => {
                const waiting = items.filter(({ status }) =>
                  ["SURVEYING", "VOTING"].includes(status),
                );
                return waiting.length ? (
                  <ul>
                    {waiting.map(({ id, title }) => (
                      <li key={id}>
                        <Link to={`/proposals/${id}`}>{title}</Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">아직 기다리는 강좌가 없습니다.</p>
                );
              }}
            </Resource>
          </section>
          <section className="panel">
            <h2>알림 종류</h2>
            <p className="muted">
              관심을 표시한 수업이 개설되면 알림함에서 확인할 수 있어요.
            </p>
            <Link className="button quiet" to="/my">
              내 활동 보기
            </Link>
          </section>
        </aside>
      </div>
      {error && <ErrorBox error={error} />}
    </section>
  );
}
