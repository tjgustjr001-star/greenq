import { Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { greenqApi } from "../api/greenqApi.js";
import { clearCurrentUser, defaultPathForRole, getCurrentUser, hasLogin, saveCurrentUser } from "../utils/auth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || "";
  const [loginId, setLoginId] = useState("admin");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasLogin()) return;
    const user = getCurrentUser();
    navigate(redirectTo || defaultPathForRole(user.roleCode || user.role), { replace: true });
  }, [navigate]);

  const fillDemoAccount = (nextLoginId) => {
    setLoginId(nextLoginId);
    setPassword("password");
    setError("");
  };

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
      <section className="login-visual">
        <div className="visual-card">
          <Leaf size={36} />
          <h1>GreenQ</h1>
          <p>식물공장 환경 데이터와 품질 판정, 리포트를 관리하는 운영 보조 화면입니다.</p>
        </div>
      </section>

      <form className="login-card" onSubmit={handleLogin}>
        <p className="eyebrow">GreenQ</p>
        <h2>로그인</h2>
        <p className="page-desc">테스트 계정으로 로그인할 수 있습니다.</p>
        {redirectTo && <div className="notice-box compact">QR 접근을 계속하려면 로그인하세요. 로그인 후 요청한 화면으로 이동합니다.</div>}
        <label>아이디<input value={loginId} onChange={(event) => setLoginId(event.target.value)} /></label>
        <label>비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button full" type="submit">로그인</button>
        <div className="login-hint"><strong>테스트 계정</strong><span>admin / password</span><span>worker01 / password</span></div>
        <div className="login-demo-actions">
          <button type="button" onClick={() => fillDemoAccount("admin")}>관리자 계정 입력</button>
          <button type="button" onClick={() => fillDemoAccount("worker01")}>작업자 계정 입력</button>
        </div>
      </form>
    </div>
  );
}
