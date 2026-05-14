import { Leaf } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { greenqApi } from "../api/greenqApi.js";
import { clearCurrentUser, saveCurrentUser } from "../utils/auth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("admin");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setError("");
      clearCurrentUser();
      const user = await greenqApi.login({ loginId, password });
      saveCurrentUser(user);
      navigate("/dashboard", { replace: true });
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
        <label>아이디<input value={loginId} onChange={(event) => setLoginId(event.target.value)} /></label>
        <label>비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button full" type="submit">로그인</button>
        <div className="login-hint"><strong>테스트 계정</strong><span>admin / password</span><span>worker01 / password</span></div>
      </form>
    </div>
  );
}
