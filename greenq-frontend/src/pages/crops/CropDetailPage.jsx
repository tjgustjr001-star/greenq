import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StatusSelect from "../../components/StatusSelect.jsx";
import { useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const cropStatusOptions = [{ value: "ACTIVE", label: "활성" }, { value: "INACTIVE", label: "비활성" }];

function StandardTable({ title, rows = [], isAdmin, onItemSetting }) {
  return <div className="panel"><div className="panel-head"><div><h3>{title}</h3><p className="panel-desc">DB에 저장된 현재 적용 기준값입니다.</p></div>{isAdmin && <button className="secondary-button" onClick={onItemSetting}>측정 항목 설정</button>}</div>{rows.length === 0 ? <EmptyState title="등록된 기준값이 없습니다." description="관리자 계정에서 측정 항목 설정을 통해 항목을 추가할 수 있습니다." /> : <table><thead><tr><th>항목</th><th>기준 최소</th><th>기준 최대</th><th>단위</th><th>경고 이탈률</th><th>사용 여부</th></tr></thead><tbody>{rows.map((row) => <tr key={row.standardItemId || row.itemCode}><td><strong>{row.itemName}</strong><small className="table-sub">{row.itemCode}</small></td><td>{row.min ?? "-"}</td><td>{row.max ?? "-"}</td><td>{row.unit}</td><td>{row.failRate ?? "-"}%</td><td><StatusBadge value={row.useYn === "Y" ? "ACTIVE" : "INACTIVE"} /></td></tr>)}</tbody></table>}</div>;
}

export default function CropDetailPage() {
  const { cropId } = useParams();
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data: crop, loading, error, reload } = useApiData(() => greenqApi.crop(cropId), [cropId]);

  const updateStatus = async (nextStatus) => {
    await greenqApi.updateCrop(cropId, { ...crop, cropStatus: nextStatus });
    await reload();
  };

  if (loading) return <div className="panel"><p className="muted-text">작물 상세를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !crop) return <EmptyState title="작물을 찾을 수 없습니다." description={error || "잘못된 작물 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/crops")}>작물 목록으로</button>} />;

  return <div className="page"><PageHeader eyebrow="Crop Detail" title={`${crop.cropName} 기준값 조회`} description="작물 상세 정보와 현재 적용 중인 환경/품질 기준값을 조회합니다." actions={<button className="secondary-button" onClick={() => navigate("/crops")}>목록으로</button>} />{!isAdmin && <div className="notice-box">작업자는 기준값 조회만 가능합니다.</div>}<div className="panel detail-hero"><div><p className="eyebrow">Crop Information</p><h3>{crop.cropName} · {crop.varietyName}</h3><p>{crop.description}</p></div><StatusSelect value={crop.cropStatus || "ACTIVE"} options={cropStatusOptions} onChange={updateStatus} disabled={!isAdmin} label="작물 상태 변경" /></div><section className="content-grid two"><StandardTable title="환경 기준값" rows={crop.envStandards} isAdmin={isAdmin} onItemSetting={() => navigate(`/crops/${crop.cropId}/item-settings?type=ENV`)} /><StandardTable title="품질 기준값" rows={crop.qualityStandards} isAdmin={isAdmin} onItemSetting={() => navigate(`/crops/${crop.cropId}/item-settings?type=QUALITY`)} /></section></div>;
}
