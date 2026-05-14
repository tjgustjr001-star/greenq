import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const initialForm = { zoneId: null, zoneName: "", locationDesc: "", areaSize: "", zoneStatus: "ACTIVE", description: "" };
const toForm = (zone) => ({ zoneId: zone.zoneId, zoneName: zone.zoneName || "", locationDesc: zone.locationDesc || "", areaSize: zone.areaSize || "", zoneStatus: zone.zoneStatus || "ACTIVE", description: zone.description || "" });

export default function ZoneListPage() {
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data, loading, error, reload } = useApiData(() => greenqApi.zones(), []);
  const zoneRows = asArray(data);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const isEdit = Boolean(form.zoneId);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const cancelForm = () => { setForm(initialForm); setShowForm(false); };
  const saveZone = async () => {
    if (!form.zoneName.trim()) return;
    const payload = { ...form, zoneName: form.zoneName.trim(), locationDesc: form.locationDesc.trim(), areaSize: Number(form.areaSize || 0), description: form.description.trim() };
    if (isEdit) await greenqApi.updateZone(form.zoneId, payload); else await greenqApi.createZone(payload);
    cancelForm();
    await reload();
  };
  const deleteZone = async (zone) => { if (!window.confirm("구역을 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteZone(zone.zoneId); await reload(); };

  if (loading) return <div className="panel"><p className="muted-text">구역 데이터를 DB에서 불러오는 중입니다...</p></div>;

  return <div className="page"><PageHeader eyebrow="Zone & Batch" title="구역/배치 관리" description="DB에 저장된 재배 구역과 현재 배치 상태를 조회합니다." actions={isAdmin ? <button className="primary-button" onClick={() => { if (showForm) cancelForm(); else { setForm(initialForm); setShowForm(true); } }}><Plus size={16} />{showForm ? "구역 등록 닫기" : "구역 등록"}</button> : null} />{!isAdmin && <div className="notice-box">작업자는 구역 상태를 조회할 수 있습니다.</div>}{error && <div className="notice-box">{error}</div>}<section className="stat-grid three"><StatCard label="전체 구역" value={zoneRows.length} /><StatCard label="운영 구역" value={zoneRows.filter((z) => z.zoneStatus === "ACTIVE").length} tone="green" /><StatCard label="점검/비활성" value={zoneRows.filter((z) => z.zoneStatus !== "ACTIVE").length} tone="orange" /></section>{isAdmin && showForm && <div className="panel fake-form"><h3>{isEdit ? "구역 수정" : "구역 등록"}</h3><div className="form-grid"><label>구역명<input value={form.zoneName} onChange={(e) => updateForm("zoneName", e.target.value)} placeholder="예: A구역" /></label><label>위치 설명<input value={form.locationDesc} onChange={(e) => updateForm("locationDesc", e.target.value)} placeholder="예: 1동 좌측" /></label><label>면적(㎡)<input value={form.areaSize} onChange={(e) => updateForm("areaSize", e.target.value)} placeholder="예: 120" /></label><label>상태<select value={form.zoneStatus} onChange={(e) => updateForm("zoneStatus", e.target.value)}><option value="ACTIVE">활성</option><option value="MAINTENANCE">점검</option><option value="INACTIVE">비활성</option></select></label><label className="wide-field">설명<input value={form.description} onChange={(e) => updateForm("description", e.target.value)} /></label></div><div className="form-footer-actions"><button className="secondary-button" onClick={cancelForm}>취소</button><button className="primary-button" onClick={saveZone}>{isEdit ? "수정 저장" : "등록"}</button></div></div>}<div className="panel"><table><thead><tr><th>구역명</th><th>위치</th><th>면적</th><th>현재 배치</th><th>상태</th><th>관리</th></tr></thead><tbody>{zoneRows.map((zone) => <tr key={zone.zoneId}><td><button className="link-cell" onClick={() => navigate(`/zones/${zone.zoneId}`)}><strong>{zone.zoneName}</strong></button></td><td>{zone.locationDesc || "-"}</td><td>{zone.areaSize ?? "-"}㎡</td><td>{zone.currentBatch || "-"}</td><td><StatusBadge value={zone.zoneStatus} /></td><td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/zones/${zone.zoneId}`) }, isAdmin && { label: "수정", kind: "edit", onClick: () => { setForm(toForm(zone)); setShowForm(true); } }, isAdmin && { label: "삭제", kind: "delete", danger: true, onClick: () => deleteZone(zone) }]} /></td></tr>)}</tbody></table></div></div>;
}
