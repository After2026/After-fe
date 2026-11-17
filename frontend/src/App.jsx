import { useState, useEffect, useContext } from "react";
import {
  Link,
  NavLink,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { service, demoMode } from "./lib/service";
import { Auth, ErrorBox, Logo, Icon } from "./ui";
import { Home, Detail, NewProposal, My, Guide } from "./pages/Proposals";
import { Vote, Results } from "./pages/Voting";
import { Login, Signup } from "./pages/Authentication";
import { Notifications, NotificationsBell } from "./pages/Notifications";
import { Enrollments, Admin } from "./pages/Management";
function Protected({ children, admin = false }) {
  const { user, loading } = useContext(Auth);
  if (loading)
    return (
      <p className="empty" role="status">
        세션을 확인하고 있습니다.
      </p>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !demoMode && !["ADMIN", "SUPER_ADMIN"].includes(user.role))
    return <ErrorBox error="관리자만 접근할 수 있습니다." />;
  return children;
}
export default function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  const location = useLocation();
  const authPage = ["/login", "/signup"].includes(location.pathname),
    adminPage = location.pathname.startsWith("/admin");
  async function reload() {
    setLoading(true);
    try {
      setUser(await service.me());
      setError(null);
    } catch (e) {
      setUser(null);
      if (e.status !== 401) setError(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  async function logout() {
    try {
      await service.logout();
      setUser(null);
    } catch (e) {
      setError(e);
    }
  }
  return (
    <Auth.Provider value={{ user, loading, reload }}>
      <div
        className={`app-shell ${authPage ? "auth-shell" : ""} ${adminPage ? "admin-shell" : ""}`}
      >
        {!adminPage && location.pathname !== "/login" && (
          <header className="site-header">
            <div className="header-inner">
              <Logo />
              <nav aria-label="주 메뉴">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    isActive || location.pathname.startsWith("/proposals/")
                      ? "active"
                      : ""
                  }
                >
                  수업제안
                </NavLink>
                <NavLink to="/enrollments">수강신청</NavLink>
                <NavLink to="/my">내 수업</NavLink>
              </nav>
              <div className="account">
                {user && <NotificationsBell />}
                {user ? (
                  <>
                    <Link className="profile" to="/my">
                      <span>
                        <Icon name="user" size={13} />
                      </span>
                      {user.name}
                    </Link>
                    {
                      <button className="quiet" onClick={logout}>
                        로그아웃
                      </button>
                    }
                  </>
                ) : (
                  <>
                    <Link to="/login">로그인</Link>
                    <Link to="/signup">회원가입</Link>
                  </>
                )}
              </div>
            </div>
          </header>
        )}
        {demoMode && (
          <div className="mode-banner">
            체험 모드 · 예시 데이터 / 내 응답은 이 브라우저에만 저장됩니다.
          </div>
        )}
        <main className={authPage ? "auth-main" : ""}>
          {error && <ErrorBox error={error} retry={reload} />}
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
            <Route path="/signup" element={<Signup />} />
            <Route path="/guide" element={<Guide />} />
            <Route
              path="/notifications"
              element={
                <Protected>
                  <Notifications />
                </Protected>
              }
            />
            <Route
              path="/my"
              element={
                <Protected>
                  <My />
                </Protected>
              }
            />
            <Route path="/votes" element={<Navigate to="/my" replace />} />
            <Route
              path="/enrollments"
              element={
                <Protected>
                  <Enrollments />
                </Protected>
              }
            />
            <Route
              path="/admin"
              element={
                <Protected admin>
                  <Admin />
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
                  <Link to="/">수업제안으로</Link>
                </section>
              }
            />
          </Routes>
        </main>
        {!authPage && !adminPage && (
          <>
            <nav className="bottom-nav" aria-label="모바일 메뉴">
              {[
                ["/", "home", "제안"],
                ["/enrollments", "check", "수강신청"],
                ["/my", "user", "내 수업"],
              ].map(([path, icon, label]) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) =>
                    isActive ||
                    (path === "/" &&
                      (location.pathname.includes("/vote") ||
                        location.pathname.endsWith("/result")))
                      ? "active"
                      : ""
                  }
                >
                  <Icon name={icon} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <footer>
              <span>우리가 만드는 방과후</span>
              <Link to="/guide">이용 안내</Link>
              {(demoMode || ["ADMIN", "SUPER_ADMIN"].includes(user?.role)) && (
                <Link to="/admin">관리자 검토{demoMode ? " 체험" : ""}</Link>
              )}
              <Link to="/login">로그인 화면</Link>
            </footer>
          </>
        )}
      </div>
    </Auth.Provider>
  );
}
