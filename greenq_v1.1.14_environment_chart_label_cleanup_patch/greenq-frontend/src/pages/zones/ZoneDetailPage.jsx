import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import BatchQrModal from "../../components/BatchQrModal.jsx";
import Drawer from "../../components/Drawer.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StatusSelect from "../../components/StatusSelect.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const today = new Date().toISOString().slice(0, 10);
const initialBatchForm = { cropId: "", batchName: "", plantedQuantity: "", startDate: today, expectedEndDate: "" };
const zoneStatusOptions = [{ value: "ACTIVE", label: "활성화" }, { value: "MAINTENANCE", label: "점검" }, { value: "INACTIVE", label: "비활성화" }];

export default function ZoneDetailPage() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data, loading, error, reload } = useApiData(async () => {
    const [zone, crops, batches] = await Promise.all([greenqApi.zone(zoneId), greenqApi.crops(), greenqApi.batches()]);
    return { zone, crops, batches };
  }, [zoneId]);
  const zone = data?.zone;
  const crops = asArray(data?.crops);
  const zoneBatches = useMemo(() => asArray(data?.batches).filter((batch) => String(batch.zoneId) === String(zoneId)), [data, zoneId]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedQrBatch, setSelectedQrBatch] = useState(null);
  const [batchForm, setBatchForm] = useState(initialBatchForm);

  useEffect(() => { if (crops[0] && !batchForm.cropId) setBatchForm((prev) => ({ ...prev, cropId: String(crops[0].cropId) })); }, [crops, batchForm.cropId]);

  const openBatchDrawer = () => {
    setBatchForm({ ...initialBatchForm, cropId: String(crops[0]?.cropId || "") });
    setDrawerOpen(true);
  };
  const closeBatchDrawer = () => setDrawerOpen(false);
  const saveBatch = async () => {
    if (!batchForm.batchName.trim()) return;
    await greenqApi.createBatch({ ...batchForm, zoneId, plantedQuantity: Number(batchForm.plantedQuantity || 0), batchStatus: "PLANNED" });
    setBatchForm({ ...initialBatchForm, cropId: String(crops[0]?.cropId || "") });
    closeBatchDrawer();
    await reload();
  };
  const updateZoneStatus = async (nextStatus) => { await greenqApi.updateZone(zoneId, { ...zone, zoneStatus: nextStatus }); await reload(); };
  const deleteBatch = async (batch) => { if (!window.confirm("배치를 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteBatch(batch.batchId); await reload(); };

  if (loading) return <div className="panel"><p className="muted-text">구역 상세를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !zone) return <EmptyState title="구역을 찾을 수 없습니다." description={error || "잘못된 구역 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/zones")}>구역 목록으로</button>} />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Zone Detail"
        title={`${zone.zoneName} 상세`}
        description="DB 기준으로 구역 기본 정보, 상태 변경, 해당 구역의 작물 배치 이력을 확인합니다."
        actions={<><button className="secondary-button" onClick={() => navigate("/zones")}>목록으로</button>{isAdmin && <button className="primary-button" onClick={openBatchDrawer}><Plus size={16} />새 배치 등록</button>}</>}
      />
      <div className="panel detail-hero"><div><p className="eyebrow">Zone Information</p><h3>{zone.zoneName}</h3><p>{zone.locationDesc} · {zone.areaSize}㎡</p></div><StatusSelect value={zone.zoneStatus || "ACTIVE"} options={zoneStatusOptions} onChange={updateZoneStatus} disabled={!isAdmin} label="구역 상태 변경" /></div>
      {!isAdmin && <div className="notice-box">작업자는 구역 상태와 배치 이력을 조회할 수 있습니다.</div>}

      <Drawer
        open={isAdmin && drawerOpen}
        title="새 배치 등록"
        description="배치는 작물·구역·재배 기간·수량을 함께 연결하므로 우측 드로어에서 입력합니다."
        onClose={closeBatchDrawer}
        footer={<><button className="secondary-button" onClick={closeBatchDrawer}>취소</button><button className="primary-button" onClick={saveBatch}>등록</button></>}
      >
        <div className="drawer-form-grid">
          <label>작물 선택<select value={batchForm.cropId} onChange={(e) => setBatchForm((p) => ({ ...p, cropId: e.target.value }))}>{crops.map((crop) => <option key={crop.cropId} value={crop.cropId}>{crop.cropName} {crop.varietyName ? `(${crop.varietyName})` : ""}</option>)}</select></label>
          <label>배치명<input value={batchForm.batchName} onChange={(e) => setBatchForm((p) => ({ ...p, batchName: e.target.value }))} placeholder={`${zone.zoneName} 작물 1차`} /></label>
          <label>재배 수량<input value={batchForm.plantedQuantity} onChange={(e) => setBatchForm((p) => ({ ...p, plantedQuantity: e.target.value }))} placeholder="예: 500" /></label>
          <label>시작일<input type="date" value={batchForm.startDate} onChange={(e) => setBatchForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
          <label>예정 종료일<input type="date" value={batchForm.expectedEndDate} onChange={(e) => setBatchForm((p) => ({ ...p, expectedEndDate: e.target.value }))} /></label>
        </div>
      </Drawer>

      <BatchQrModal open={isAdmin && Boolean(selectedQrBatch)} batch={selectedQrBatch} onClose={() => setSelectedQrBatch(null)} onRegenerated={reload} />

      <div className="panel"><div className="panel-head"><h3>배치 목록</h3></div>{zoneBatches.length === 0 ? <EmptyState title="배치가 없습니다." description="현재 구역에는 등록된 배치가 없습니다." /> : <table><thead><tr><th>배치명</th><th>작물</th><th>수량</th><th>시작일</th><th>예정 종료일</th><th>상태</th><th>관리</th></tr></thead><tbody>{zoneBatches.map((batch) => <tr key={batch.batchId}><td><button className="link-cell" onClick={() => navigate(`/batches/${batch.batchId}`)}><strong>{batch.batchName}</strong></button></td><td>{batch.cropName}</td><td>{batch.plantedQuantity}</td><td>{batch.startDate}</td><td>{batch.expectedEndDate || "-"}</td><td><StatusBadge value={batch.batchStatus} /></td><td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/batches/${batch.batchId}`) }, isAdmin && { label: "QR 보기", kind: "edit", onClick: () => setSelectedQrBatch(batch) }, isAdmin && { label: "삭제", kind: "delete", danger: true, onClick: () => deleteBatch(batch) }]} /></td></tr>)}</tbody></table>}</div>
    </div>
  );
}
