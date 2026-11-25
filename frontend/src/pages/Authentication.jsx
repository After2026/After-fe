import { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { service, demoMode } from "../lib/service";
import { Auth, Logo, ErrorBox, Icon } from "../ui";
import WelcomeBandi from "../WelcomeBandi";

const welcomeSteps = [
  ["제안", "친구 5명과 듣고 싶은 수업을 올려요"],
  ["관심 표시", "전교생이 수요조사에 참여해요"],
  ["일정 투표 · 수강신청", "함께 요일을 정하고 신청해요"],
];

const loginSteps = [
  ["제안", "친구 5명과 함께 원하는 수업을 제안해요."],
  ["관심 표시", "전교생이 수요조사에 참여해 개설 여부를 미리 판단해요."],
  ["일정 투표", "함께 들을 친구들이 가능한 요일을 정해요."],
];

function AfterSteps({ steps }) {
  return (
    <ol className="after-steps">
      {steps.map(([title, description], index) => (
        <li key={title}>
          <span className="after-step-number" aria-hidden="true">
            {index + 1}
          </span>
          <span className="after-step-copy">
            <b>{title}</b>
            <span>{description}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Welcome() {
  const { reload } = useContext(Auth);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function browseDemo() {
    setBusy(true);
    setError(null);
    try {
      await service.startDemo();
      await reload();
    } catch (error) {
      setError(error);
      setBusy(false);
    }
  }

  return (
    <section className="welcome-layout">
      <div className="welcome-copy">
        <span className="welcome-status">
          {demoMode ? "2026학년도 2학기 · 제안 접수 중" : "우리가 만드는 방과후"}
        </span>
        <h1>
          <span>After</span>에<br />
          오신 걸 환영해요
        </h1>
        <p>
          듣고 싶은 수업이 없나요? 직접 제안하고, 관심을 모으고, 친구들과 요일을
          정해 방과후 수업을 함께 열어요.
        </p>
        <AfterSteps steps={welcomeSteps} />
        <div className="welcome-actions">
          <Link className="button" to="/signup">
            시작하기
          </Link>
          {demoMode ? (
            <button className="quiet" disabled={busy} onClick={browseDemo}>
              {busy ? "불러오는 중…" : "지금 올라온 제안 보기"}
            </button>
          ) : (
            <Link className="button quiet" to="/login">
              지금 올라온 제안 보기
            </Link>
          )}
        </div>
        {error && <ErrorBox error={error} />}
      </div>
      <WelcomeBandi />
    </section>
  );
}

export function Login() {
  const { reload } = useContext(Auth),
    navigate = useNavigate();
  const destination = useLocation().state?.from || "/";
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [visible, setVisible] = useState(false),
    [recovery, setRecovery] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await service.login({
        username: f.get("username"),
        password: f.get("password"),
        rememberMe: f.has("rememberMe"),
      });
      await reload();
      navigate(destination, { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function startDemo() {
    setBusy(true);
    setError(null);
    try {
      await service.startDemo();
      await reload();
      navigate(destination, { replace: true });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-layout">
      <section className="login-story">
        <Logo kind="login" />
        <div className="login-story-copy">
          <h1>
            듣고 싶은 수업,
            <br />
            이제 직접 열어요.
          </h1>
          <AfterSteps steps={loginSteps} />
        </div>
        <small>방과후학교</small>
      </section>
      <section className="login-form">
        <div className="login-form-content">
          <h2>로그인</h2>
          <form onSubmit={submit}>
            <label className="field">
              아이디
              <input
                name="username"
                autoComplete="username"
                required
                placeholder="아이디 입력"
              />
            </label>
            <div className="field">
              <label htmlFor="login-password">비밀번호</label>
              <div className="password-input">
                <input
                  id="login-password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="비밀번호 입력"
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setVisible(!visible)}
                  aria-pressed={visible}
                  aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  <Icon name="eye" size={20} />
                </button>
              </div>
            </div>
            {error && <ErrorBox error={error} />}
            <label className="choice">
              <input name="rememberMe" type="checkbox" />
              로그인 상태 유지
            </label>
            <button className="block" disabled={busy}>
              {busy ? "로그인 중…" : "로그인"}
            </button>
          </form>
          <div className="auth-links">
            <button
              type="button"
              className="icon-button"
              aria-expanded={recovery}
              onClick={() => setRecovery(!recovery)}
            >
              비밀번호 찾기
            </button>
            <span aria-hidden="true" />
            <Link to="/signup">회원가입</Link>
          </div>
          {recovery && (
            <p className="info" role="status">
              학교 계정 비밀번호 재설정은 담당 선생님에게 문의해 주세요.
            </p>
          )}
          {demoMode && (
            <button
              type="button"
              className="quiet block demo-login"
              disabled={busy}
              onClick={startDemo}
            >
              체험 시작 (회원가입 없이)
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
export function Signup() {
  const [error, setError] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [terms, setTerms] = useState(false),
    [privacy, setPrivacy] = useState(false),
    [optional, setOptional] = useState(false),
    [usernameCheck, setCheck] = useState(null),
    [username, setUsername] = useState("");
  const checkedAll = terms && privacy && optional;
  async function check() {
    if (!username.trim()) return;
    try {
      const result = await service.usernameCheck(username);
      setCheck({ username, available: result.available });
    } catch (e) {
      setError(e);
    }
  }
  const checkMessage =
    usernameCheck?.username === username
      ? usernameCheck.available
        ? "사용 가능한 아이디입니다."
        : "이미 사용 중인 아이디입니다."
      : null;
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    if (f.get("password") !== f.get("confirm")) {
      setError(new Error("비밀번호가 일치하지 않습니다."));
      return;
    }
    if (!terms || !privacy) {
      setError(new Error("필수 약관에 동의해 주세요."));
      return;
    }
    setBusy(true);
    try {
      await service.signup({
        signupCode: f.get("signupCode"),
        username: f.get("username"),
        password: f.get("password"),
        name: f.get("name"),
        studentNumber: f.get("studentNumber"),
        grade: Number(f.get("grade")),
        classNumber: Number(f.get("classNumber")),
        email: f.get("email") || null,
        termsAgreed: terms,
        privacyAgreed: privacy,
        notificationConsent: optional,
      });
      setMessage(
        "가입 신청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.",
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="signup-page">
      <div className="signup-layout">
        <aside className="signup-steps">
          <h1>회원가입</h1>
          <ol>
            {["가입 인증번호", "정보 입력 · 약관 동의", "선생님 승인 대기"].map(
              (step, index) => (
                <li
                  key={step}
                  aria-current={
                    index === (message ? 2 : 1) ? "step" : undefined
                  }
                >
                  <span aria-hidden="true">{index + 1}</span>
                  {step}
                </li>
              ),
            )}
          </ol>
          <div className="info">
            가입 신청 후 담당 선생님이 학번·이름을 재학생 명부와 확인하면
            로그인할 수 있어요. 1인 1계정만 허용돼요.
          </div>
        </aside>
        {message ? (
          <section className="panel signup-confirmation">
            <h2>선생님 승인 대기</h2>
            <p className="success" role="status">
              {message}
            </p>
            <Link className="button" to="/login">
              로그인으로 이동
            </Link>
          </section>
        ) : (
          <form onSubmit={submit}>
            {demoMode && (
              <p className="info">
                체험 모드에서는 가입 화면을 둘러볼 수 있어요. 실제 가입은 학교
                서비스에서 신청해 주세요.
              </p>
            )}
            <section className="panel">
              <h2>가입 인증번호</h2>
              <label className="field">
                인증번호 <span className="required">*</span>
                <input
                  name="signupCode"
                  required
                  placeholder="학교에서 받은 인증번호"
                />
              </label>
              <small className="muted">
                제출 시 서버에서 인증번호를 확인합니다.
              </small>
            </section>
            <section className="panel">
              <h2>계정</h2>
              <div className="field">
                <label htmlFor="signup-username">
                  아이디 <span className="required">*</span>
                </label>
                <div className="inline-input">
                  <input
                    name="username"
                    id="signup-username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setCheck(null);
                    }}
                    required
                    minLength={4}
                    placeholder="아이디 입력"
                  />
                  <button
                    className="quiet"
                    type="button"
                    onClick={check}
                    disabled={username.trim().length < 4}
                  >
                    중복 확인
                  </button>
                </div>
              </div>
              {checkMessage && (
                <p className="muted" role="status">
                  {checkMessage}
                </p>
              )}
              <div className="form-row">
                <label className="field">
                  비밀번호 <span className="required">*</span>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="8자 이상 입력"
                  />
                </label>
                <label className="field">
                  비밀번호 확인 <span className="required">*</span>
                  <input
                    name="confirm"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="한 번 더 입력"
                  />
                </label>
              </div>
            </section>
            <section className="panel">
              <h2>학생 정보</h2>
              <div className="form-row signup-student-fields">
                <label className="field">
                  이름 <span className="required">*</span>
                  <input name="name" required placeholder="홍길동" />
                </label>
                <label className="field">
                  학번 <span className="required">*</span>
                  <input
                    name="studentNumber"
                    inputMode="numeric"
                    required
                    placeholder="20301"
                  />
                </label>
                <label className="field">
                  학년
                  <select name="grade">
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}학년
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  반
                  <select name="classNumber">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}반
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                이메일 · 선택
                <input
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                />
              </label>
              <small className="muted">비밀번호 재설정에 사용됩니다.</small>
            </section>
            <section className="panel terms">
              <h2>약관 동의</h2>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={checkedAll}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                    setPrivacy(e.target.checked);
                    setOptional(e.target.checked);
                  }}
                />
                약관 전체 동의
              </label>
              <label className="choice">
                <input
                  required
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                  }}
                />
                필수 이용약관 동의
              </label>
              <label className="choice">
                <input
                  required
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => {
                    setPrivacy(e.target.checked);
                  }}
                />
                필수 개인정보 수집·이용 동의
              </label>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={optional}
                  onChange={(e) => {
                    setOptional(e.target.checked);
                  }}
                />
                선택 알림 수신
              </label>
              <small className="muted">
                학교의 정식 약관 원문은 서비스 운영 전 연결이 필요합니다.
              </small>
            </section>
            {error && <ErrorBox error={error} />}
            <div className="form-actions">
              <Link className="quiet" to="/login">
                취소
              </Link>
              <button disabled={busy || demoMode}>
                {busy ? "접수 중…" : "가입 신청"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
