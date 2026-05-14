import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

function formatChartValue(value) {
  if (!Number.isFinite(value)) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function MetricChart({ title, unit, rows, metric, min, max }) {
  const values = rows.map((row) => Number(row[metric])).filter((value) => Number.isFinite(value));
  const chartMin = min ?? (values.length ? Math.min(...values) : 0);
  const chartMax = max ?? (values.length ? Math.max(...values) : 1);
  const chartMid = (chartMin + chartMax) / 2;
  const range = chartMax - chartMin || 1;
  const chartTop = 16;
  const chartBottom = 82;
  const chartHeight = chartBottom - chartTop;
  const clampY = (value) => {
    const rawY = chartBottom - ((value - chartMin) / range) * chartHeight;
    return Math.min(chartBottom, Math.max(chartTop, rawY));
  };
  const points = rows.map((row, index) => {
    const value = Number(row[metric]);
    const x = rows.length === 1 ? 50 : (index / (rows.length - 1)) * 100;
    const y = Number.isFinite(value) ? clampY(value) : chartBottom;
    return `${x},${y}`;
  }).join(" ");
  const latestValue = values.length ? values[values.length - 1] : null;

  return (
    <div className="chart-card">
      <div className="chart-head">
        <div>
          <strong>{title}</strong>
          <p>최근 6시간 측정값 추이</p>
        </div>
        <span>{latestValue ?? "-"}{latestValue !== null ? unit : ""}</span>
      </div>
      {rows.length === 0 ? (
        <div className="empty-chart">선택한 배치의 최근 6시간 데이터가 없습니다.</div>
      ) : (
        <div className="chart-plot">
          <div className="chart-y-scale" aria-hidden="true">
            <span>{formatChartValue(chartMax)}{unit}</span>
            <span>{formatChartValue(chartMid)}{unit}</span>
            <span>{formatChartValue(chartMin)}{unit}</span>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart" aria-label={`${title} 추이 차트`}>
            <line x1="0" y1={chartTop} x2="100" y2={chartTop} />
            <line x1="0" y1={(chartTop + chartBottom) / 2} x2="100" y2={(chartTop + chartBottom) / 2} />
            <line x1="0" y1={chartBottom} x2="100" y2={chartBottom} />
            <polyline points={points} />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function EnvironmentPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const initialBatchId = searchParams.get("batchId") || "";
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [notice, setNotice] = useState("");
  const { data, loading, error, reload } = useApiData(async () => {
    const [zones, batches, logs] = await Promise.all([greenqApi.zones(), greenqApi.batches(), greenqApi.environmentLogs({ batchId: selectedBatchId, hours: 6 })]);
    return { zones, batches, logs };
  }, [selectedBatchId]);

  const zones = asArray(data?.zones);
  const batches = asArray(data?.batches);
  const selectedBatch = batches.find((batch) => String(batch.batchId) === String(selectedBatchId));
  const filteredBatches = selectedZoneId ? batches.filter((batch) => String(batch.zoneId) === String(selectedZoneId)) : batches;
  const logs = useMemo(() => asArray(data?.logs).slice().sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt)), [data]);
  const tableLogs = logs.slice().reverse();

  useEffect(() => { if (!selectedZoneId && selectedBatch) setSelectedZoneId(String(selectedBatch.zoneId)); }, [selectedBatch, selectedZoneId]);

  const runSimulator = async (forceAbnormal) => {
    if (!selectedBatchId) { setNotice("먼저 배치를 선택해야 합니다."); return; }
    await greenqApi.runEnvironmentSimulator({ batchId: selectedBatchId, forceAbnormal });
    setNotice(forceAbnormal ? "부적합 테스트 데이터가 DB에 생성되었습니다." : "정상 시뮬레이터 데이터가 DB에 생성되었습니다.");
    await reload();
  };
  const deleteLog = async (log) => { if (!window.confirm("환경 데이터를 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteEnvironmentLog(log.envLogId); await reload(); };
  const changeZone = (zoneId) => { setSelectedZoneId(zoneId); const first = batches.find((batch) => !zoneId || String(batch.zoneId) === String(zoneId)); setSelectedBatchId(first ? String(first.batchId) : ""); setSearchParams(first ? { batchId: String(first.batchId) } : {}); };
  const changeBatch = (batchId) => { setSelectedBatchId(batchId); setSearchParams(batchId ? { batchId } : {}); };

  if (loading) return <div className="panel"><p className="muted-text">환경 데이터를 DB에서 불러오는 중입니다...</p></div>;

  return <div className="page"><PageHeader eyebrow="Environment" title="환경 모니터링" description="구역과 배치를 선택해 DB에 저장된 최근 6시간 환경 데이터를 확인합니다." actions={isAdmin ? <><button className="secondary-button" onClick={() => runSimulator(false)}><Plus size={16} />정상 데이터 생성</button><button className="primary-button" onClick={() => runSimulator(true)}>부적합 테스트 생성</button></> : null} />{!isAdmin && <div className="notice-box">작업자는 환경 데이터를 조회할 수 있습니다.</div>}{error && <div className="notice-box">{error}</div>}{notice && <div className="notice-box">{notice}</div>}<div className="panel filter-panel"><div className="form-grid"><label>구역 선택<select value={selectedZoneId} onChange={(e) => changeZone(e.target.value)}><option value="">전체 구역</option>{zones.map((zone) => <option key={zone.zoneId} value={zone.zoneId}>{zone.zoneName}</option>)}</select></label><label>배치 선택<select value={selectedBatchId} onChange={(e) => changeBatch(e.target.value)}><option value="">전체 배치</option>{filteredBatches.map((batch) => <option key={batch.batchId} value={batch.batchId}>{batch.zoneName} · {batch.batchName}</option>)}</select></label><label>그래프 범위<input value="최근 6시간" disabled /></label></div>{selectedBatch && <p className="panel-desc">현재 그래프 기준: {selectedBatch.zoneName} · {selectedBatch.batchName}</p>}</div><section className="stat-grid three"><StatCard label="정상" value={tableLogs.filter((log) => log.envStatus === "NORMAL").length} tone="green" /><StatCard label="주의" value={tableLogs.filter((log) => log.envStatus === "CAUTION").length} tone="orange" /><StatCard label="경고" value={tableLogs.filter((log) => log.envStatus === "FAIL").length} tone="red" /></section><section className="chart-grid"><MetricChart title="온도" unit="℃" rows={logs} metric="temperature" min={16} max={30} /><MetricChart title="습도" unit="%" rows={logs} metric="humidity" min={40} max={85} /><MetricChart title="pH" unit="" rows={logs} metric="ph" min={5.5} max={7.0} /><MetricChart title="EC" unit="" rows={logs} metric="ec" min={1.0} max={2.2} /></section><div className="panel"><table><thead><tr><th>측정시각</th><th>구역</th><th>배치</th><th>온도</th><th>습도</th><th>pH</th><th>EC</th><th>상태</th><th>관리</th></tr></thead><tbody>{tableLogs.map((log) => <tr key={log.envLogId}><td>{log.measuredAt}</td><td>{log.zoneName}</td><td><strong>{log.batchName}</strong></td><td>{log.temperature}℃</td><td>{log.humidity}%</td><td>{log.ph}</td><td>{log.ec}</td><td><StatusBadge value={log.envStatus} /></td><td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/environment/logs/${log.envLogId}`) }, isAdmin && { label: "삭제", kind: "delete", danger: true, onClick: () => deleteLog(log) }]} /></td></tr>)}</tbody></table></div></div>;
}
