import { useState, useEffect, useContext } from "react";
import { Link, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import BandiGuide from "./BandiGuide";
import { service, demoMode } from "./lib/service";
import { Auth, ErrorBox, Logo, Icon } from "./ui";
import { Home, Detail, NewProposal, EditProposal, My, Guide } from "./pages/Proposals";
import { Vote, Results } from "./pages/Voting";
import { Login, Signup, Welcome } from "./pages/Authentication";
import { Notifications, NotificationsBell } from "./pages/Notifications";
import { ConfirmedCourses, Enrollments, Teacher } from "./pages/Management";
const studentMenu = [
  { path: "/", icon: "home", label: "수업 제안", mobileLabel: "제안" },
  {
    path: "/courses",
    icon: "book",
    label: "개설 확정 수업",
    mobileLabel: "개설 수업",
  },
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

function Protected({ children, role }) {
  const { user, loading } = useContext(Auth);
  const location = useLocation();
  if (loading)
    return (
      <p className="empty" role="status">
        세션을 확인하고 있습니다.
      </p>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role)
    return <ErrorBox error={role === "TEACHER" ? "학교 선생님만 접근할 수 있습니다." : "학생만 접근할 수 있습니다."} />;
  return children;
}
export default function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const welcomePage = location.pathname === "/" && !loading && !user;
  const authPage =
      welcomePage || ["/login", "/signup"].includes(location.pathname),
    teacherPage = location.pathname === "/teacher",
    teacher = user?.role === "TEACHER";
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
      navigate("/", { replace: true });
    } catch (e) {
      setError(e);
    }
  }
  async function switchDemo(role) {
    if (!demoMode) return;
    try {
      if (role === "TEACHER") await service.startTeacherDemo();
      else await service.startDemo();
      await reload();
      navigate(role === "TEACHER" ? "/teacher" : "/", { replace: true });
    } catch (e) {
      setError(e);
    }
  }
  return (
    <Auth.Provider value={{ user, loading, reload, logout, switchDemo }}>
      <div
        className={`app-shell ${authPage ? "auth-shell" : ""} ${teacherPage ? "admin-shell" : ""} ${welcomePage ? "welcome-shell" : ""} ${location.pathname === "/signup" ? "signup-shell" : ""}`}
      >
        {!teacherPage && location.pathname !== "/login" && (
          <header className="site-header">
            <div className="header-inner">
              <Logo kind={welcomePage ? "wordmark" : undefined} />
              {!authPage && user && !teacher && <StudentNav />}
              {!authPage && teacher && (
                <nav aria-label="주 메뉴">
                  <Link to="/teacher">제안 접수 · 일정 확정</Link>
                  <Link to="/courses">개설 확정 수업</Link>
                </nav>
              )}
              <div className="account">
                {!authPage && user && <NotificationsBell />}
                {!authPage && user ? (
                  <>
                    <Link className="profile" to={teacher ? "/teacher" : "/my"}>
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
                    {teacher ? <Navigate to="/teacher" replace /> : <Home />}
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
                <Protected role="STUDENT">
                  <My />
                </Protected>
              }
            />
            <Route path="/votes" element={<Navigate to="/my" replace />} />
            <Route
              path="/courses"
              element={
                <Protected>
                  <ConfirmedCourses />
                </Protected>
              }
            />
            <Route
              path="/enrollments"
              element={
                <Protected>
                  <Enrollments />
                </Protected>
              }
            />
            <Route
              path="/teacher"
              element={
                <Protected role="TEACHER">
                  <Teacher />
                </Protected>
              }
            />
            <Route path="/admin" element={<Navigate to="/teacher" replace />} />
            <Route
              path="/proposals/new"
              element={
                <Protected role="STUDENT">
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
              path="/proposals/:id/edit"
              element={
                <Protected role="STUDENT">
                  <EditProposal />
                </Protected>
              }
            />
            <Route
              path="/proposals/:id/vote"
              element={
                <Protected role="STUDENT">
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
        {!authPage && !teacherPage && user && (
          <>
            {!teacher && <StudentNav mobile />}
            <footer>
              <span>
                {demoMode
                  ? "체험 모드 · 응답은 이 브라우저에 저장됩니다."
                  : "우리가 만드는 방과후"}
              </span>
              <Link to="/guide">이용 안내</Link>
              {demoMode && user.role === "STUDENT" && (
                <button className="quiet" onClick={() => switchDemo("TEACHER")}>
                  선생님 화면 체험
                </button>
              )}
            </footer>
          </>
        )}
      </div>
    </Auth.Provider>
  );
}
