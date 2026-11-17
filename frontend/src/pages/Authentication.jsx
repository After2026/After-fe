import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { service, demoMode } from "../lib/service";
import { Auth, Logo, ErrorBox } from "../ui";
export function Login() {
  const { reload } = useContext(Auth),
    navigate = useNavigate();
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [visible, setVisible] = useState(false);
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
      navigate("/");
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
      navigate("/");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-layout">
      <section className="login-story">
        <Logo />
        <div>
          <h1>
            듣고 싶은 수업,
            <br />
            이제 직접 열어요.
          </h1>
          <ol>
            <li>
              <b>제안</b>
              <span>친구들과 함께 배우고 싶은 수업을 제안해요.</span>
            </li>
            <li>
              <b>관심 표시</b>
              <span>관심을 모아 우리 학교의 방과후를 만들어요.</span>
            </li>
            <li>
              <b>일정 투표</b>
              <span>함께할 수 있는 시간을 고르고 수업을 만나요.</span>
            </li>
          </ol>
        </div>
        <small>방과후 수업 제안 플랫폼</small>
      </section>
      <section className="login-form">
        <Logo />
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
          <label className="field">
            비밀번호
            <div className="password-input">
              <input
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
                aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                ◉
              </button>
            </div>
          </label>
          {error && <ErrorBox error={error} />}
          <label className="choice">
            <input name="rememberMe" type="checkbox" />
            로그인 상태 유지
          </label>
          <button className="block" disabled={busy}>
            {busy ? "로그인 중…" : "로그인"}
          </button>
          <div className="auth-links">
            <Link to="/guide">이용 안내</Link>
            <span>|</span>
            <Link to="/signup">회원가입</Link>
          </div>
          {demoMode && (
            <button
              type="button"
              className="quiet block"
              disabled={busy}
              onClick={startDemo}
            >
              체험 시작 (회원가입 없이)
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
export function Signup() {
  const [error, setError] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [all, setAll] = useState(false),
    [terms, setTerms] = useState(false),
    [privacy, setPrivacy] = useState(false),
    [optional, setOptional] = useState(false),
    [usernameCheck, setCheck] = useState(null),
    [username, setUsername] = useState("");
  async function check() {
    if (!username.trim()) return;
    try {
      const result = await service.usernameCheck(username);
      setCheck(
        result.available
          ? "사용 가능한 아이디입니다."
          : "이미 사용 중인 아이디입니다.",
      );
    } catch (e) {
      setError(e);
    }
  }
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
      <div className="page-heading">
        <h1>회원가입</h1>
      </div>
      <div className="signup-layout">
        <aside className="signup-steps">
          <p>① 가입 인증번호</p>
          <p className="current">② 계정 · 학생 정보</p>
          <p>③ 약관 동의</p>
          <div className="info">
            가입 인증번호는 학교에서 안내받은 코드를 입력하세요. 역할은
            인증번호에 따라 결정됩니다.
          </div>
        </aside>
        <form onSubmit={submit}>
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
            <label className="field">
              아이디 <span className="required">*</span>
              <div className="inline-input">
                <input
                  name="username"
                  aria-label="아이디"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setCheck(null);
                  }}
                  required
                  minLength={4}
                  placeholder="아이디 입력"
                />
                <button className="quiet" type="button" onClick={check}>
                  중복 확인
                </button>
              </div>
            </label>
            {usernameCheck && (
              <p className="muted" role="status">
                {usernameCheck}
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
            <div className="form-row">
              <label className="field">
                이름 <span className="required">*</span>
                <input name="name" required placeholder="홍길동" />
              </label>
              <label className="field">
                학번 <span className="required">*</span>
                <input name="studentNumber" required placeholder="20301" />
              </label>
            </div>
            <div className="form-row">
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
              <input name="email" type="email" placeholder="name@example.com" />
            </label>
            <small className="muted">비밀번호 재설정에 사용됩니다.</small>
          </section>
          <section className="panel terms">
            <h2>약관 동의</h2>
            <label className="choice">
              <input
                type="checkbox"
                checked={all}
                onChange={(e) => {
                  setAll(e.target.checked);
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
                  setAll(false);
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
                  setAll(false);
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
                  setAll(false);
                }}
              />
              선택 알림 수신
            </label>
            <small className="muted">
              학교의 정식 약관 원문은 서비스 운영 전 연결이 필요합니다.
            </small>
          </section>
          {error && <ErrorBox error={error} />}
          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          <div className="form-actions">
            <Link className="quiet" to="/login">
              취소
            </Link>
            <button disabled={busy}>{busy ? "접수 중…" : "가입 신청"}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
