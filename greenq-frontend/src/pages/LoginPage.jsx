import { Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { greenqApi } from "../api/greenqApi.js";
import { clearCurrentUser, defaultPathForRole, getCurrentUser, hasLogin, saveCurrentUser } from "../utils/auth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || "";
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasLogin()) return;
    const user = getCurrentUser();
    navigate(redirectTo || defaultPathForRole(user.roleCode || user.role), { replace: true });
  }, [navigate, redirectTo]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setError("");
      clearCurrentUser();
      const user = await greenqApi.login({ loginId, password });
      saveCurrentUser(user);
      navigate(redirectTo || defaultPathForRole(user.roleCode || user.role), { replace: true });
    } catch (err) {
      setError(err.message || "아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="login-hero-mark">
            <Leaf size={34} />
          </div>
          <p className="login-brand-eyebrow">Plant Factory Quality ERP</p>
          <h1 className="login-brand-title">GreenQ</h1>
          <p className="login-brand-description">
            식물공장의 환경 데이터, 품질 실측, 부적합 이력, 리포트를 하나의 흐름으로 관리하는 품질관리 ERP 시스템입니다.
          </p>
          <div className="login-feature-list">
            <div className="login-feature-item">
              <strong>환경 모니터링</strong>
              <span>온도·습도·pH·EC 상태를 기준값과 비교합니다.</span>
            </div>
            <div className="login-feature-item">
              <strong>품질 실측 관리</strong>
              <span>작업자 실측 데이터를 기반으로 품질 상태를 판정합니다.</span>
            </div>
            <div className="login-feature-item">
              <strong>부적합·리포트</strong>
              <span>이상 이력을 조치와 리포트로 연결합니다.</span>
            </div>
          </div>
        </section>

      <form className="login-auth-panel" onSubmit={handleLogin}>
        <div className="login-card-head">
          <p className="login-auth-eyebrow">GREENQ</p>
          <h2 className="login-auth-title">GreenQ 로그인</h2>
          <p className="login-auth-description">부여된 계정으로 시스템에 접속하세요.</p>
        </div>

        {redirectTo && <div className="notice-box compact">요청한 화면으로 이동하려면 먼저 로그인하세요.</div>}

        <div className="login-form">
          <label>
            아이디
            <input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </label>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button className="primary-button full login-submit-button" type="submit">로그인</button>

        <div className="login-info-box">
          <strong>계정 안내</strong>
          <span>계정 발급 및 권한 변경은 시스템 관리자에게 문의하세요.</span>
        </div>
      </form>
      </div>
    </div>
  );
}
