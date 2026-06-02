import { Plus } from "lucide-react";
import { useState } from "react";
import { greenqApi } from "../../api/greenqApi.js";
import Modal from "../../components/Modal.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const initialForm = {
  loginId: "",
  password: "password",
  userName: "",
  roleCode: "WORKER",
  accountStatus: "ACTIVE",
  email: "",
  phone: "",
};

export default function UserListPage() {
  const user = getCurrentUser();
  const isAdmin = (user.role || user.roleCode) === "ADMIN";
  const { data, loading, error, reload } = useApiData(() => greenqApi.users(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saveError, setSaveError] = useState("");

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const openModal = () => { setForm(initialForm); setSaveError(""); setModalOpen(true); };
  const closeModal = () => { setForm(initialForm); setSaveError(""); setModalOpen(false); };

  const saveUser = async () => {
    if (!form.loginId.trim() || !form.userName.trim()) {
      setSaveError("로그인 ID와 사용자명은 필수입니다.");
      return;
    }
    await greenqApi.createUser({
      ...form,
      loginId: form.loginId.trim(),
      userName: form.userName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    closeModal();
    await reload();
  };

  if (loading) return <div className="panel"><p className="muted-text">사용자 데이터를 불러오는 중입니다...</p></div>;

  return (
    <div className="page">
      <PageHeader
        eyebrow="User"
        title="사용자 관리"
        description="관리자와 작업자 계정을 조회합니다."
        actions={isAdmin ? <button className="primary-button" onClick={openModal}><Plus size={16} />사용자 등록</button> : null}
      />
      {!isAdmin && <div className="notice-box">작업자 계정에서는 사용자 관리 기능이 제한됩니다.</div>}
      {error && <div className="notice-box">{error}</div>}

      <Modal
        open={isAdmin && modalOpen}
        title="사용자 등록"
        description="관리자는 신규 작업자 또는 관리자 계정을 모달에서 빠르게 등록할 수 있습니다."
        onClose={closeModal}
        footer={<><button className="secondary-button" onClick={closeModal}>취소</button><button className="primary-button" onClick={saveUser}>등록</button></>}
      >
        {saveError && <div className="form-error">{saveError}</div>}
        <div className="form-grid modal-form-grid">
          <label>로그인 ID<input value={form.loginId} onChange={(e) => updateForm("loginId", e.target.value)} placeholder="예: worker03" /></label>
          <label>초기 비밀번호<input type="password" value={form.password} onChange={(e) => updateForm("password", e.target.value)} placeholder="초기 비밀번호" /></label>
          <label>사용자명<input value={form.userName} onChange={(e) => updateForm("userName", e.target.value)} placeholder="예: 작업자3" /></label>
          <label>권한<select value={form.roleCode} onChange={(e) => updateForm("roleCode", e.target.value)}><option value="WORKER">작업자</option><option value="ADMIN">관리자</option></select></label>
          <label>계정 상태<select value={form.accountStatus} onChange={(e) => updateForm("accountStatus", e.target.value)}><option value="ACTIVE">활성</option><option value="INACTIVE">비활성</option><option value="LOCKED">잠금</option></select></label>
          <label>이메일<input value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="선택 입력" /></label>
          <label>연락처<input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="선택 입력" /></label>
        </div>
      </Modal>

      <div className="panel"><table><thead><tr><th>로그인 ID</th><th>사용자명</th><th>권한</th><th>상태</th><th>이메일</th><th>생성일</th></tr></thead><tbody>{asArray(data).map((item) => <tr key={item.userId}><td><strong>{item.loginId}</strong></td><td>{item.userName}</td><td><StatusBadge value={item.roleCode} /></td><td><StatusBadge value={item.accountStatus} /></td><td>{item.email || "-"}</td><td>{item.createdAt}</td></tr>)}</tbody></table></div>
    </div>
  );
}
