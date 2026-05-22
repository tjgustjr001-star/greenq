import { Plus } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { labelOf } from "../../data/displayLabels.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";

const statusOrder = ["NORMAL", "CAUTION", "FAIL", "MISSING", "SKIPPED"];

function countByStatus(rows) {
  return rows.reduce((acc, row) => {
    const key = String(row.qualityStatus || "MISSING").toUpperCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export default function QualityPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const batchId = searchParams.get("batchId") || "";
  const status = searchParams.get("status") || "";

  const { data, loading, error, reload } = useApiData(async () => {
    const [batches, measurements] = await Promise.all([greenqApi.batches(), greenqApi.measurements()]);
    return { batches, measurements };
  }, []);

  const batches = asArray(data?.batches);
  const measurements = useMemo(() => {
    return asArray(data?.measurements).filter((m) => {
      const batchOk = !batchId || String(m.batchId) === String(batchId);
      const statusOk = !status || String(m.qualityStatus || "").toUpperCase() === status;
      return batchOk && statusOk;
    });
  }, [data, batchId, status]);
  const counts = countByStatus(measurements);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const deleteMeasurement = async (m) => {
    if (!window.confirm("실측 데이터를 DB에서 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteMeasurement(m.measurementId);
    await reload();
  };

  if (loading) return <div className="panel"><p className="muted-text">실측 데이터를 DB에서 불러오는 중입니다...</p></div>;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Quality"
        title="실측/품질 관리"
        description="작업자 실측 데이터, 자동 품질 평가 결과, 품질 부적합 흐름을 조회합니다."
        actions={<button className="primary-button" onClick={() => navigate(`/quality/new${batchId ? `?batchId=${batchId}` : ""}`)}><Plus size={16} />실측 입력</button>}
      />
      {error && <div className="notice-box">{error}</div>}

      <div className="panel quality-filter-panel">
        <div className="quality-filter-grid">
          <label>배치<select value={batchId} onChange={(e) => setFilter("batchId", e.target.value)}><option value="">전체 배치</option>{batches.map((batch) => <option key={batch.batchId} value={batch.batchId}>{batch.zoneName} · {batch.batchName} · {batch.cropName}</option>)}</select></label>
          <label>품질 상태<select value={status} onChange={(e) => setFilter("status", e.target.value)}><option value="">전체 상태</option>{statusOrder.map((s) => <option key={s} value={s}>{labelOf(s)}</option>)}</select></label>
          <div className="quality-filter-summary"><span>조회 결과</span><strong>{measurements.length}건</strong><p>{batchId ? "선택 배치 기준" : "전체 배치 기준"}</p></div>
        </div>
      </div>

      <section className="stat-grid five compact">
        <div className="stat-card"><p>전체</p><strong>{measurements.length}</strong><span>실측 데이터</span></div>
        {statusOrder.map((s) => <div className="stat-card" key={s}><p>{labelOf(s)}</p><strong>{counts[s] || 0}</strong><span>품질 판정</span></div>)}
      </section>

      <div className="panel">
        <div className="panel-head"><div><h3>실측 데이터 조회</h3><p className="panel-desc">저장 완료 시 품질 평가와 품질 부적합이 자동 생성됩니다.</p></div></div>
        <table>
          <thead><tr><th>측정일시</th><th>구역/배치</th><th>작물</th><th>샘플</th><th>초장 평균</th><th>엽폭 평균</th><th>엽장 평균</th><th>생체중 평균</th><th>품질 상태</th><th>관리</th></tr></thead>
          <tbody>
            {measurements.map((m) => (
              <tr key={m.measurementId}>
                <td>{m.measuredAt}</td>
                <td><button className="link-cell" onClick={() => navigate(`/quality/${m.measurementId}`)}><strong>{m.zoneName || "-"}</strong><br /><small>{m.batchName}</small></button></td>
                <td>{m.cropName || "-"}</td><td>{m.sampleCount}</td><td>{m.plantHeight ?? "-"}</td><td>{m.leafWidth ?? "-"}</td><td>{m.leafLength ?? "-"}</td><td>{m.freshWeight ?? "-"}</td><td><StatusBadge value={m.qualityStatus} /></td>
                <td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/quality/${m.measurementId}`) }, { label: "삭제", kind: "delete", danger: true, onClick: () => deleteMeasurement(m) }]} /></td>
              </tr>
            ))}
            {measurements.length === 0 && <tr><td colSpan={10} className="empty-table-cell">조회 조건에 맞는 실측 데이터가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
