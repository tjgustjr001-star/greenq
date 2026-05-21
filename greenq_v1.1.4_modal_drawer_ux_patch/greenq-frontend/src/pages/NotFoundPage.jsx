import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <EmptyState
      title="페이지를 찾을 수 없습니다."
      description="주소가 잘못되었거나 아직 준비되지 않은 화면입니다."
      action={<button className="primary-button" onClick={() => navigate("/dashboard")}>대시보드로 이동</button>}
    />
  );
}
