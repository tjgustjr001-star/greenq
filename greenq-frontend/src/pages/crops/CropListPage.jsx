import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { cropTypeLabels } from "../../data/displayLabels.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const initialForm = { cropId: null, cropName: "", varietyName: "", cropType: "LEAFY", cropStatus: "ACTIVE", description: "" };
const toForm = (crop) => ({ cropId: crop.cropId, cropName: crop.cropName || "", varietyName: crop.varietyName || "", cropType: crop.cropType || "LEAFY", cropStatus: crop.cropStatus || "ACTIVE", description: crop.description || "" });

export default function CropListPage() {
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data, loading, error, reload } = useApiData(() => greenqApi.crops(), []);
  const cropRows = asArray(data);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const isEdit = Boolean(form.cropId);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const startCreate = () => { setForm(initialForm); setShowForm(true); };
  const startEdit = (crop) => { setForm(toForm(crop)); setShowForm(true); };
  const cancelForm = () => { setForm(initialForm); setShowForm(false); };

  const saveCrop = async () => {
    if (!form.cropName.trim()) return;
    const payload = { ...form, cropName: form.cropName.trim(), varietyName: form.varietyName.trim(), description: form.description.trim() };
    if (isEdit) await greenqApi.updateCrop(form.cropId, payload);
    else await greenqApi.createCrop(payload);
    cancelForm();
    await reload();
  };

  const deleteCrop = async (crop) => {
    if (!window.confirm("작물을 DB에서 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteCrop(crop.cropId);
    await reload();
  };

  if (loading) return <div className="panel"><p className="muted-text">작물 데이터를 DB에서 불러오는 중입니다...</p></div>;

  return (
    <div className="page">
      <PageHeader eyebrow="Crop & Standard" title="작물/기준 관리" description="DB에 저장된 작물 목록을 확인하고 작물별 기준 관리로 이동합니다." actions={isAdmin ? <button className="primary-button" onClick={showForm ? cancelForm : startCreate}><Plus size={16} />{showForm ? "작물 등록 닫기" : "작물 등록"}</button> : null} />
      {!isAdmin && <div className="notice-box">작업자는 작물과 기준값을 조회할 수 있습니다.</div>}
      {error && <div className="notice-box">{error}</div>}
      {isAdmin && showForm && (
        <div className="panel fake-form"><h3>{isEdit ? "작물 수정" : "작물 등록"}</h3><div className="form-grid">
          <label>작물명<input value={form.cropName} onChange={(e) => updateForm("cropName", e.target.value)} placeholder="예: 상추" /></label>
          <label>품종명<input value={form.varietyName} onChange={(e) => updateForm("varietyName", e.target.value)} placeholder="예: 청치마" /></label>
          <label>작물 유형<select value={form.cropType} onChange={(e) => updateForm("cropType", e.target.value)}><option value="LEAFY">엽채류</option><option value="FRUIT">과채류</option><option value="HERB">허브류</option><option value="ETC">기타</option></select></label>
          <label>상태<select value={form.cropStatus} onChange={(e) => updateForm("cropStatus", e.target.value)}><option value="ACTIVE">활성</option><option value="INACTIVE">비활성</option></select></label>
          <label className="wide-field">설명<input value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="작물 설명" /></label>
        </div><div className="form-footer-actions"><button className="secondary-button" onClick={cancelForm}>취소</button><button className="primary-button" onClick={saveCrop}>{isEdit ? "수정 저장" : "등록"}</button></div></div>
      )}
      <div className="panel"><table><thead><tr><th>작물명</th><th>품종명</th><th>유형</th><th>환경 기준</th><th>품질 기준</th><th>상태</th><th>관리</th></tr></thead><tbody>{cropRows.map((crop) => <tr key={crop.cropId}><td><button className="link-cell" onClick={() => navigate(`/crops/${crop.cropId}`)}><strong>{crop.cropName}</strong></button></td><td>{crop.varietyName || "-"}</td><td>{cropTypeLabels[crop.cropType] || crop.cropType}</td><td>{crop.envStandards?.length || 0}개</td><td>{crop.qualityStandards?.length || 0}개</td><td><StatusBadge value={crop.cropStatus} /></td><td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/crops/${crop.cropId}`) }, isAdmin && { label: "수정", kind: "edit", onClick: () => startEdit(crop) }, isAdmin && { label: "삭제", kind: "delete", danger: true, onClick: () => deleteCrop(crop) }]} /></td></tr>)}</tbody></table></div>
    </div>
  );
}
