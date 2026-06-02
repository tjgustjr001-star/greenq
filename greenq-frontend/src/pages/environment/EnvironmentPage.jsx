import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";
import { batchNameWithZone } from "../../utils/batchLabel.js";

const GRAPH_RANGE_OPTIONS = [
  { value: "6", label: "최근 6시간", help: "실시간 이상 여부 확인" },
  { value: "12", label: "최근 12시간", help: "반일 단위 흐름 확인" },
  { value: "24", label: "최근 24시간", help: "일일 환경 변화 확인" },
  { value: "72", label: "최근 3일", help: "단기 추세 확인" },
  { value: "168", label: "최근 7일", help: "주간 추세 확인" },
  { value: "0", label: "전체 기간", help: "저장된 전체 로그 확인" },
];

function findRangeOption(value) {
  return GRAPH_RANGE_OPTIONS.find((option) => option.value === String(value)) ?? GRAPH_RANGE_OPTIONS[0];
}

function formatChartValue(value) {
  if (!Number.isFinite(value)) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function metricValue(row, metric) {
  const value = Number(row?.[metric]);
  return Number.isFinite(value) ? value : null;
}

const SERIES_STROKES = [
  "#3f8f5a",
  "#2563eb",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#65a30d",
  "#be185d",
];

function toTime(row) {
  const time = new Date(row?.measuredAt).getTime();
  return Number.isFinite(time) ? time : null;
}

function inferCropNameFromBatch(row) {
  const explicitCropName = String(row?.cropName ?? "").trim();
  if (explicitCropName) return explicitCropName;

  const batchName = String(row?.batchName ?? "").trim();
  if (!batchName) return "";

  let inferred = batchName;
  const zoneName = String(row?.zoneName ?? "").trim();
  if (zoneName && inferred.startsWith(zoneName)) {
    inferred = inferred.slice(zoneName.length).trim();
  }

  inferred = inferred
    .replace(/20\d{2}[-./년]\s*\d{1,2}(?:월)?/g, " ")
    .replace(/\d+\s*차/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return inferred || batchName;
}

function getSeriesKey(row, groupBy) {
  if (groupBy === "crop") {
    const label = getSeriesLabel(row, groupBy);
    return String(row.cropId ?? row.cropName ?? label ?? row.batchId ?? "unknown");
  }
  if (groupBy === "batch") return String(row.batchId ?? row.batchName ?? "unknown");
  return "single";
}

function getSeriesLabel(row, groupBy) {
  if (groupBy === "crop") {
    const cropName =
      String(row?.cropName ?? "").trim() ||
      inferCropNameFromBatch(row) ||
      "작물 미지정";

    return cropName;
  }

  if (groupBy === "batch") {
    return (
      String(row?.batchName ?? "").trim() ||
      inferCropNameFromBatch(row) ||
      "배치 미지정"
    );
  }

  return "선택 배치";
}

function buildMetricSeries(rows, metric, groupBy) {
  const seriesMap = new Map();
  rows.forEach((row) => {
    const value = metricValue(row, metric);
    const time = toTime(row);
    if (value === null || time === null) return;
    const key = getSeriesKey(row, groupBy);
    const label = getSeriesLabel(row, groupBy);
    if (!seriesMap.has(key)) {
      seriesMap.set(key, { key, label, points: [], latestTime: time, latestValue: value });
    }
    const series = seriesMap.get(key);
    series.points.push({ time, value });
    if (time >= series.latestTime) {
      series.latestTime = time;
      series.latestValue = value;
    }
  });

  return Array.from(seriesMap.values())
    .map((series) => ({ ...series, points: series.points.sort((a, b) => a.time - b.time) }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
}

function MetricChart({ title, unit, rows, metric, min, max, rangeLabel, groupBy = "single" }) {
  const seriesList = buildMetricSeries(rows, metric, groupBy);
  const values = seriesList.flatMap((series) => series.points.map((point) => point.value));
  const times = seriesList.flatMap((series) => series.points.map((point) => point.time));
  const latestPoint = seriesList
    .flatMap((series) => series.points.map((point) => ({ ...point, label: series.label })))
    .sort((a, b) => b.time - a.time)[0];
  const isMultiSeries = groupBy !== "single" && seriesList.length > 1;

  if (values.length === 0 || times.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-head">
          <div>
            <strong>{title}</strong>
            <p>{rangeLabel} 측정값 추이</p>
          </div>
          <span>-</span>
        </div>
        <div className="empty-chart">선택한 조건의 {title} 데이터가 없습니다.</div>
      </div>
    );
  }

  const chartMin = min ?? Math.min(...values);
  const chartMax = max ?? Math.max(...values);
  const chartMid = (chartMin + chartMax) / 2;
  const valueRange = chartMax - chartMin || 1;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;
  const chartTop = 16;
  const chartBottom = 82;
  const chartHeight = chartBottom - chartTop;
  const clampY = (value) => {
    const rawY = chartBottom - ((value - chartMin) / valueRange) * chartHeight;
    return Math.min(chartBottom, Math.max(chartTop, rawY));
  };
  const pointToString = (point, series) => {
    const x = series.points.length === 1 ? 50 : ((point.time - minTime) / timeRange) * 100;
    return `${x},${clampY(point.value)}`;
  };

  return (
    <div className="chart-card">
      <div className="chart-head">
        <div>
          <strong>{title}</strong>
          <p>{rangeLabel} 측정값 추이</p>
        </div>
        {!isMultiSeries && <span>{`${formatChartValue(latestPoint?.value)}${unit}`}</span>}
      </div>
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
          {seriesList.map((series, index) => (
            <polyline
              key={series.key}
              className="series-line"
              style={{ stroke: SERIES_STROKES[index % SERIES_STROKES.length] }}
              points={series.points.map((point) => pointToString(point, series)).join(" ")}
            />
          ))}
        </svg>
      </div>
      {isMultiSeries && (
        <div className="chart-legend" aria-label={`${title} 작물별 범례`}>
          {seriesList.map((series, index) => (
            <span key={series.key} className="chart-legend-item">
              <i style={{ background: SERIES_STROKES[index % SERIES_STROKES.length] }} aria-hidden="true" />
              {series.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function statusCount(rows, status) {
  return rows.filter((log) => log.envStatus === status).length;
}

function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "-";
  return `${value}${suffix}`;
}

export default function EnvironmentPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = getCurrentUser();
  const isAdmin = (currentUser.role || currentUser.roleCode) === "ADMIN";
  const initialZoneId = searchParams.get("zoneId") || "";
  const initialBatchId = searchParams.get("batchId") || "";
  const initialHours = findRangeOption(searchParams.get("hours") || "6").value;
  const [selectedZoneId, setSelectedZoneId] = useState(initialZoneId);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [selectedHours, setSelectedHours] = useState(initialHours);
  const [notice, setNotice] = useState("");
  const selectedRange = findRangeOption(selectedHours);
  const hoursParam = selectedHours === "0" ? undefined : Number(selectedHours);

  const updateSearchParams = (zoneId = selectedZoneId, batchId = selectedBatchId, hours = selectedHours) => {
    const nextParams = {};
    if (zoneId) nextParams.zoneId = String(zoneId);
    if (batchId) nextParams.batchId = String(batchId);
    if (hours && hours !== "6") nextParams.hours = String(hours);
    setSearchParams(nextParams);
  };

  const { data, loading, error, reload } = useApiData(async () => {
    const [zones, batches, logs] = await Promise.all([
      greenqApi.zones(),
      greenqApi.batches(),
      greenqApi.environmentLogs({ zoneId: selectedZoneId, batchId: selectedBatchId, hours: hoursParam }),
    ]);
    return { zones, batches, logs };
  }, [selectedZoneId, selectedBatchId, selectedHours]);

  const zones = asArray(data?.zones);
  const batches = asArray(data?.batches);
  const selectedZone = zones.find((zone) => String(zone.zoneId) === String(selectedZoneId));
  const selectedBatch = batches.find((batch) => String(batch.batchId) === String(selectedBatchId));
  const filteredBatches = selectedZoneId ? batches.filter((batch) => String(batch.zoneId) === String(selectedZoneId)) : batches;
  const logs = useMemo(() => asArray(data?.logs).slice().sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt)), [data]);
  const tableLogs = useMemo(() => logs.slice().reverse(), [logs]);
  const chartGroupBy = selectedBatchId ? "single" : "crop";
  const statusCounts = useMemo(() => ({
    total: tableLogs.length,
    normal: statusCount(tableLogs, "NORMAL"),
    caution: statusCount(tableLogs, "CAUTION"),
    fail: statusCount(tableLogs, "FAIL"),
    missing: statusCount(tableLogs, "MISSING"),
    skipped: statusCount(tableLogs, "SKIPPED"),
  }), [tableLogs]);

  useEffect(() => {
    if (!selectedZoneId && selectedBatch) setSelectedZoneId(String(selectedBatch.zoneId));
  }, [selectedBatch, selectedZoneId]);

  const scopeLabel = selectedBatch
    ? batchNameWithZone(selectedBatch)
    : selectedZone
      ? `${selectedZone.zoneName} 전체 배치`
      : "전체 구역 · 전체 배치";

  const runSimulator = async (forceAbnormal) => {
    if (!selectedBatchId) {
      setNotice("시뮬레이터 데이터 생성은 특정 배치를 선택한 뒤 실행할 수 있습니다.");
      return;
    }
    await greenqApi.runEnvironmentSimulator({ batchId: selectedBatchId, forceAbnormal });
    setNotice(forceAbnormal ? "부적합 테스트 데이터가 생성되었습니다." : "정상 시뮬레이터 데이터가 생성되었습니다.");
    await reload();
    window.dispatchEvent(new CustomEvent("greenq:env-alerts-refresh"));
  };

  const deleteLog = async (log) => {
    if (!window.confirm("환경 데이터를 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteEnvironmentLog(log.envLogId);
    await reload();
  };

  const changeZone = (zoneId) => {
    setSelectedZoneId(zoneId);
    setSelectedBatchId("");
    updateSearchParams(zoneId, "", selectedHours);
  };

  const changeBatch = (batchId) => {
    const nextBatch = batches.find((batch) => String(batch.batchId) === String(batchId));
    const nextZoneId = nextBatch ? String(nextBatch.zoneId) : selectedZoneId;
    if (nextBatch) setSelectedZoneId(nextZoneId);
    setSelectedBatchId(batchId);
    updateSearchParams(nextZoneId, batchId, selectedHours);
  };

  const changeGraphRange = (hours) => {
    setSelectedHours(hours);
    updateSearchParams(selectedZoneId, selectedBatchId, hours);
  };

  if (loading) return <div className="panel"><p className="muted-text">환경 데이터를 불러오는 중입니다...</p></div>;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Environment"
        title="환경 모니터링"
        description={`구역과 배치를 선택해 환경 데이터를 확인합니다.`}
        actions={isAdmin ? (
          <>
            <button className="secondary-button" onClick={() => runSimulator(false)}><Plus size={16} />정상 데이터 생성</button>
            <button className="primary-button" onClick={() => runSimulator(true)}>부적합 테스트 생성</button>
          </>
        ) : null}
      />
      {!isAdmin && <div className="notice-box">작업자는 환경 데이터를 조회할 수 있습니다.</div>}
      {error && <div className="notice-box">{error}</div>}
      {notice && <div className="notice-box">{notice}</div>}

      <div className="panel environment-filter-panel">
        <div className="environment-filter-header">
          <div>
            <strong>조회 조건</strong>
            <p>{scopeLabel} 기준으로 {selectedRange.label} 데이터를 조회합니다.</p>
          </div>
          <span>{selectedRange.help}</span>
        </div>
        <div className="environment-filter-grid">
          <label>
            <span>구역 선택</span>
            <select value={selectedZoneId} onChange={(e) => changeZone(e.target.value)}>
              <option value="">전체 구역</option>
              {zones.map((zone) => <option key={zone.zoneId} value={zone.zoneId}>{zone.zoneName}</option>)}
            </select>
          </label>
          <label>
            <span>배치 선택</span>
            <select value={selectedBatchId} onChange={(e) => changeBatch(e.target.value)}>
              <option value="">전체 배치</option>
              {filteredBatches.map((batch) => <option key={batch.batchId} value={batch.batchId}>{batchNameWithZone(batch)}</option>)}
            </select>
          </label>
          <label>
            <span>그래프 범위</span>
            <select value={selectedHours} onChange={(e) => changeGraphRange(e.target.value)}>
              {GRAPH_RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <section className="stat-grid environment-stat-grid">
        <StatCard label="전체" value={statusCounts.total} tone="green" />
        <StatCard label="정상" value={statusCounts.normal} tone="green" />
        <StatCard label="주의" value={statusCounts.caution} tone="orange" />
        <StatCard label="경고" value={statusCounts.fail} tone="red" />
        <StatCard label="누락" value={statusCounts.missing} tone="blue" />
        <StatCard label="제외" value={statusCounts.skipped} tone="blue" />
      </section>

      <section className="chart-grid">
        <MetricChart title="온도" unit="℃" rows={logs} metric="temperature" min={16} max={30} rangeLabel={selectedRange.label} groupBy={chartGroupBy} />
        <MetricChart title="습도" unit="%" rows={logs} metric="humidity" min={40} max={85} rangeLabel={selectedRange.label} groupBy={chartGroupBy} />
        <MetricChart title="pH" unit="" rows={logs} metric="ph" min={5.5} max={7.0} rangeLabel={selectedRange.label} groupBy={chartGroupBy} />
        <MetricChart title="EC" unit="" rows={logs} metric="ec" min={1.0} max={2.2} rangeLabel={selectedRange.label} groupBy={chartGroupBy} />
      </section>

      <div className="panel environment-log-table-panel">
        <div className="panel-head">
          <div>
            <h3>환경 로그</h3>
            <p className="panel-desc">차트와 동일한 조회 조건의 로그만 표시합니다.</p>
          </div>
          <span className="table-count">{tableLogs.length}건</span>
        </div>
        {tableLogs.length === 0 ? (
          <EmptyState title="환경 데이터가 없습니다." description="선택한 구역, 배치, 그래프 범위에 해당하는 환경 로그가 없습니다." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>측정시각</th>
                <th>구역</th>
                <th>배치</th>
                <th>온도</th>
                <th>습도</th>
                <th>pH</th>
                <th>EC</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {tableLogs.map((log) => (
                <tr key={log.envLogId}>
                  <td>{log.measuredAt}</td>
                  <td>{log.zoneName}</td>
                  <td><strong>{log.batchName}</strong></td>
                  <td>{formatValue(log.temperature, "℃")}</td>
                  <td>{formatValue(log.humidity, "%")}</td>
                  <td>{formatValue(log.ph)}</td>
                  <td>{formatValue(log.ec)}</td>
                  <td><StatusBadge value={log.envStatus} /></td>
                  <td>
                    <ActionMenu items={[
                      { label: "상세 보기", kind: "detail", onClick: () => navigate(`/environment/logs/${log.envLogId}`) },
                      isAdmin && { label: "삭제", kind: "delete", danger: true, onClick: () => deleteLog(log) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
