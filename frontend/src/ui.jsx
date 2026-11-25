import { useState, useEffect, createContext } from "react";
import { Link } from "react-router-dom";
import { statuses, categories } from "./lib/service";
export const Auth = createContext(null);
export function Icon({ name, size = 18, ...props }) {
  const paths = {
    bulb: <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3ZM9.5 18.5h5M10.5 21h3" />,
    eye: <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6Z" />,
    home: (
      <>
        <path d="M4 8h16v12H4zM8 8V4h8v4M9 12h6M9 16h6" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="3" />
        <path d="M8 3v5m8-5v5M4 11h16M8 15h3" />
      </>
    ),
    check: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
    bell: (
      <>
        <path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4zM10 20h4" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    code: <path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-10-2 16" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    book: (
      <>
        <rect x="4" y="4" width="16" height="17" rx="2" />
        <path d="M4 16h16M8 8h8" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.book}
    </svg>
  );
}
export function Logo() {
  return (
    <Link className="brand" to="/">
      <span className="logo-symbol"><Icon name="bulb" size={21} /></span>
      <span className="brand-text"><strong>After</strong><span>우리가 만드는 방과후</span></span>
    </Link>
  );
}
export function date(v) {
  return v
    ? new Date(v).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "미정";
}
export function useResource(loader, deps = []) {
  const [state, set] = useState({ loading: true, data: null, error: null }),
    [rev, refresh] = useState(0);
  useEffect(() => {
    let active = true;
    set({ loading: true, data: null, error: null });
    Promise.resolve()
      .then(loader)
      .then((data) => {
        if (active) set({ loading: false, data, error: null });
      })
      .catch((error) => {
        if (active) set({ loading: false, data: null, error });
      });
    return () => {
      active = false;
    };
  }, [...deps, rev]);
  return { ...state, reload: () => refresh((v) => v + 1) };
}
export function ErrorBox({ error, retry }) {
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
export function Resource({ resource: r, children }) {
  return r.loading ? (
    <p role="status" className="empty">
      불러오는 중…
    </p>
  ) : r.error ? (
    <ErrorBox error={r.error} retry={r.reload} />
  ) : (
    children(r.data)
  );
}
export function Tag({ status }) {
  return <span className={`tag ${status}`}>{statuses[status] || status}</span>;
}
export function CategoryIcon({ category }) {
  return (
    <span className={`category-icon ${category}`}>
      <Icon
        name={
          category === "IT"
            ? "code"
            : category === "ARTS_PE"
              ? "globe"
              : category === "CAREER"
                ? "book"
                : "calendar"
        }
      />
    </span>
  );
}
export function Progress({ value, max = 20, tone = "" }) {
  return (
    <div className={`progress ${tone}`}>
      <span
        style={{
          width: `${Math.max(0, Math.min(100, (value / (max || 1)) * 100))}%`,
        }}
      />
    </div>
  );
}
export function Card({ p }) {
  return (
    <Link className="proposal-card" to={`/proposals/${p.id}`}>
      <CategoryIcon category={p.category} />
      <div className="card-copy">
        <div className="card-meta">
          <span>
            {categories[p.category]} · {p.targetGrades?.join("~")}학년
          </span>
          <Tag status={p.status} />
        </div>
        <h3>{p.title}</h3>
        <small>제안자 {p.proposerName} · 관심을 모으고 있어요</small>
      </div>
      <div className="card-meter">
        <Progress
          value={p.interestCount}
          max={p.threshold}
          tone={p.category === "ARTS_PE" ? "orange" : ""}
        />
        <span>
          <b>{p.interestCount}</b> / {p.threshold}명
        </span>
        <small>{p.status === "VOTING" ? "투표 진행중" : "상세 보기 →"}</small>
      </div>
    </Link>
  );
}
