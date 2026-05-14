import { greenqApi } from "../../api/greenqApi.js";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

export default function UserListPage() {
  const user = getCurrentUser();
  const isAdmin = (user.role || user.roleCode) === "ADMIN";
  const { data, loading, error } = useApiData(() => greenqApi.users(), []);
  if (loading) return <div className="panel"><p className="muted-text">사용자 데이터를 DB에서 불러오는 중입니다...</p></div>;
  return <div className="page"><PageHeader eyebrow="User" title="사용자 관리" description="DB에 저장된 관리자와 작업자 계정을 조회합니다." />{!isAdmin && <div className="notice-box">작업자 계정에서는 사용자 관리 기능이 제한됩니다.</div>}{error && <div className="notice-box">{error}</div>}<div className="panel"><table><thead><tr><th>로그인 ID</th><th>사용자명</th><th>권한</th><th>상태</th><th>생성일</th></tr></thead><tbody>{asArray(data).map((item) => <tr key={item.userId}><td><strong>{item.loginId}</strong></td><td>{item.userName}</td><td><StatusBadge value={item.roleCode} /></td><td><StatusBadge value={item.accountStatus} /></td><td>{item.createdAt}</td></tr>)}</tbody></table></div></div>;
}
