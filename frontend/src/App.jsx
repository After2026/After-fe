import { useState, useEffect, useContext } from "react";
import { Link, Routes, Route, useLocation, Navigate } from "react-router-dom";
import BandiGuide from "./BandiGuide";
import { service, demoMode } from "./lib/service";
import { Auth, ErrorBox, Logo, Icon } from "./ui";
import { Home, Detail, NewProposal, My, Guide } from "./pages/Proposals";
import { Vote, Results } from "./pages/Voting";
import { Login, Signup, Welcome } from "./pages/Authentication";
import { Notifications, NotificationsBell } from "./pages/Notifications";
import { Enrollments, Admin } from "./pages/Management";
const studentMenu = [
  { path: "/", icon: "home", label: "수업 제안", mobileLabel: "제안" },
  { path: "/enrollments", icon: "check", label: "수강신청" },
  { path: "/my", icon: "user", label: "내 활동" },
];

function StudentNav({ mobile = false }) {
  const { pathname } = useLocation();
  return (
    <nav
      className={mobile ? "bottom-nav" : undefined}
      aria-label={mobile ? "모바일 메뉴" : "주 메뉴"}
    >
      {studentMenu.map(({ path, icon, label, mobileLabel }) => {
        const current = pathname === path;
        const active =
          current || (path === "/" && pathname.startsWith("/proposals/"));
        return (
          <Link
            key={path}
            to={path}
            className={active ? "active" : undefined}
            aria-current={current ? "page" : active ? "location" : undefined}
          >
            {mobile && <Icon name={icon} />}
            <span>{mobile ? (mobileLabel ?? label) : label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Protected({ children, admin = false }) {
  const { user, loading } = useContext(Auth);
  const location = useLocation();
  if (loading)
    return (
      <p className="empty" role="status">
        세션을 확인하고 있습니다.
      </p>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (admin && !demoMode && !["ADMIN", "SUPER_ADMIN"].includes(user.role))
    return <ErrorBox error="관리자만 접근할 수 있습니다." />;
  return children;
}
export default function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  const location = useLocation();
  const welcomePage = location.pathname === "/" && !loading && !user;
  const authPage =
      welcomePage || ["/login", "/signup"].includes(location.pathname),
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
        className={`app-shell ${authPage ? "auth-shell" : ""} ${adminPage ? "admin-shell" : ""} ${welcomePage ? "welcome-shell" : ""} ${location.pathname === "/signup" ? "signup-shell" : ""}`}
      >
        {!adminPage && location.pathname !== "/login" && (
          <header className="site-header">
            <div className="header-inner">
              <Logo kind={welcomePage ? "wordmark" : undefined} />
              {!authPage && user && <StudentNav />}
              <div className="account">
                {!authPage && user && <NotificationsBell />}
                {!authPage && user ? (
                  <>
                    <Link className="profile" to="/my">
                      <span aria-hidden="true">
                        {user.name?.[0] || <Icon name="user" size={16} />}
                      </span>
                      <span className="profile-label">
                        {user.grade && user.classNumber
                          ? `${user.grade}학년 ${user.classNumber}반`
                          : user.name}
                      </span>
                    </Link>
                    <button className="quiet" onClick={logout}>
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login">로그인</Link>
                    {location.pathname !== "/signup" && (
                      <Link className="button" to="/signup">
                        회원가입
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </header>
        )}
        <main className={authPage ? "auth-main" : ""}>
          {error && <ErrorBox error={error} retry={reload} />}
          <Routes>
            <Route
              path="/"
              element={
                welcomePage ? (
                  <Welcome />
                ) : (
                  <Protected>
                    <Home />
                  </Protected>
                )
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
        <BandiGuide welcome={welcomePage} user={user} />
        {!authPage && !adminPage && user && (
          <>
            <StudentNav mobile />
            <footer>
              <span>
                {demoMode
                  ? "체험 모드 · 응답은 이 브라우저에 저장됩니다."
                  : "우리가 만드는 방과후"}
              </span>
              <Link to="/guide">이용 안내</Link>
              {(demoMode || ["ADMIN", "SUPER_ADMIN"].includes(user?.role)) && (
                <Link to="/admin">관리자 검토{demoMode ? " 체험" : ""}</Link>
              )}
            </footer>
          </>
        )}
      </div>
    </Auth.Provider>
  );
}
