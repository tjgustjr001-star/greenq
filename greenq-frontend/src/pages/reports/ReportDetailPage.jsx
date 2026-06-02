import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { labelOf } from "../../data/displayLabels.js";
import { useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const STATUS_ORDER = ["NORMAL", "CAUTION", "FAIL", "MISSING", "SKIPPED"];
const STATUS_LABELS = {
  NORMAL: "정상",
  CAUTION: "주의",
  FAIL: "경고",
  MISSING: "미입력",
  SKIPPED: "판정 제외",
};

const TREND_METRICS = [
  { key: "temperature", label: "온도", unit: "℃", digit: 1 },
  { key: "humidity", label: "습도", unit: "%", digit: 1 },
  { key: "ph", label: "pH", unit: "", digit: 2 },
  { key: "ec", label: "EC", unit: "", digit: 2 },
];

function parseCondition(json) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digit = 1) {
  const number = toNumber(value);
  if (number === null) return "-";
  if (Number.isInteger(number)) return String(number);
  return number.toFixed(digit).replace(/\.0$/, "");
}

function SummaryPanel({ title, children }) {
  return <div className="panel info-panel report-info-panel"><h3>{title}</h3><p>{children || "-"}</p></div>;
}

function formatDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${min}`;
}

function formatAxisDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  return `${mm}.${dd} ${hh}시`;
}

function getMetricPoints(rows, metric) {
  return asList(rows)
    .map((row) => ({
      time: new Date(row.measuredAt).getTime(),
      measuredAt: row.measuredAt,
      value: toNumber(row[metric.key]),
    }))
    .filter((point) => Number.isFinite(point.time) && point.value !== null)
    .sort((a, b) => a.time - b.time);
}

function getMetricStats(points) {
  if (points.length === 0) {
    return { latest: null, average: null, min: null, max: null, firstAt: null, lastAt: null };
  }
  const values = points.map((point) => point.value);
  return {
    latest: points[points.length - 1].value,
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    firstAt: points[0].measuredAt,
    lastAt: points[points.length - 1].measuredAt,
  };
}

function TrendMetricSummary({ metric, rows }) {
  const points = getMetricPoints(rows, metric);
  const stats = getMetricStats(points);
  return (
    <div className="report-trend-summary-card">
      <span>{metric.label}</span>
      <strong>{formatNumber(stats.average, metric.digit)}{metric.unit}</strong>
      <small>최저 {formatNumber(stats.min, metric.digit)}{metric.unit} · 최고 {formatNumber(stats.max, metric.digit)}{metric.unit}</small>
    </div>
  );
}

function ReportTrendChart({ rows, metric }) {
  const points = getMetricPoints(rows, metric);

  if (points.length === 0) {
    return (
      <div className="report-trend-chart-card">
        <div className="report-trend-chart-head">
          <div>
            <strong>{metric.label}</strong>
            <p>선택 기간 내 측정값 없음</p>
          </div>
          <span>-</span>
        </div>
        <div className="report-empty-visual compact">데이터 없음</div>
      </div>
    );
  }

  const stats = getMetricStats(points);
  const rawMin = stats.min;
  const rawMax = stats.max;
  const valuePadding = Math.max(
    (rawMax - rawMin) * 0.18,
    metric.key === "ph" ? 0.12 : metric.key === "ec" ? 0.08 : 0.8,
  );
  const minValue = rawMin - valuePadding;
  const maxValue = rawMax + valuePadding;
  const valueRange = maxValue - minValue || 1;
  const minTime = points[0].time;
  const maxTime = points[points.length - 1].time;
  const timeRange = maxTime - minTime || 1;

  const svgWidth = 320;
  const svgHeight = 164;
  const plotLeft = 8;
  const plotRight = 312;
  const plotTop = 18;
  const plotBottom = 134;
  const plotHeight = plotBottom - plotTop;
  const midPoint = points[Math.floor(points.length / 2)];
  const midValue = (minValue + maxValue) / 2;

  const plottedPoints = points.map((point) => {
    const x = points.length === 1 ? svgWidth / 2 : plotLeft + ((point.time - minTime) / timeRange) * (plotRight - plotLeft);
    const y = plotBottom - ((point.value - minValue) / valueRange) * plotHeight;
    return {
      ...point,
      x,
      y: Math.min(plotBottom, Math.max(plotTop, y)),
    };
  });

  const linePath = plottedPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath = plottedPoints.length > 1
    ? `${linePath} L ${plottedPoints[plottedPoints.length - 1].x.toFixed(2)} ${plotBottom} L ${plottedPoints[0].x.toFixed(2)} ${plotBottom} Z`
    : "";
  const markerPoints = plottedPoints.length === 1
    ? []
    : plottedPoints.length <= 28
      ? plottedPoints
      : [plottedPoints[0], plottedPoints[Math.floor(plottedPoints.length / 2)], plottedPoints[plottedPoints.length - 1]];
  const latestPoint = plottedPoints[plottedPoints.length - 1];

  return (
    <div className="report-trend-chart-card">
      <div className="report-trend-chart-head">
        <div>
          <strong>{metric.label}</strong>
          <p>{formatDateLabel(stats.firstAt)} ~ {formatDateLabel(stats.lastAt)}</p>
        </div>
        <span>평균 {formatNumber(stats.average, metric.digit)}{metric.unit}</span>
      </div>
      <div className="report-trend-chart-plot">
        <div className="report-trend-y-scale" aria-hidden="true">
          <span>{formatNumber(maxValue, metric.digit)}{metric.unit}</span>
          <span>{formatNumber(midValue, metric.digit)}{metric.unit}</span>
          <span>{formatNumber(minValue, metric.digit)}{metric.unit}</span>
        </div>
        <div className="report-trend-chart-body">
          <svg
            className="report-trend-line-chart"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            aria-label={`${metric.label} 시간대별 추이`}
          >
            <line className="trend-grid-line" x1="0" y1={plotTop} x2={svgWidth} y2={plotTop} />
            <line className="trend-grid-line" x1="0" y1={(plotTop + plotBottom) / 2} x2={svgWidth} y2={(plotTop + plotBottom) / 2} />
            <line className="trend-grid-line" x1="0" y1={plotBottom} x2={svgWidth} y2={plotBottom} />
            {plottedPoints.length > 1 && <path className="trend-area" d={areaPath} />}
            {plottedPoints.length > 1 && <path className="trend-line" d={linePath} />}
            {points.length === 1 && latestPoint && (
              <circle className="trend-marker latest" cx={latestPoint.x} cy={latestPoint.y} r="5" />
            )}
            {markerPoints.map((point, index) => (
              <circle
                key={`${point.time}-${index}`}
                className={`trend-marker${point.time === latestPoint?.time ? " latest" : ""}`}
                cx={point.x}
                cy={point.y}
                r={point.time === latestPoint?.time ? "4.6" : "3.4"}
              />
            ))}
          </svg>
          <div className="report-trend-x-scale" aria-hidden="true">
            <span>{formatAxisDateLabel(points[0].measuredAt)}</span>
            <span>{formatAxisDateLabel(midPoint?.measuredAt)}</span>
            <span>{formatAxisDateLabel(points[points.length - 1].measuredAt)}</span>
          </div>
        </div>
      </div>
      <div className="report-trend-stat-row">
        <span>최저 {formatNumber(rawMin, metric.digit)}{metric.unit}</span>
        <span>최고 {formatNumber(rawMax, metric.digit)}{metric.unit}</span>
        <span>최근 {formatNumber(stats.latest, metric.digit)}{metric.unit}</span>
      </div>
    </div>
  );
}

function ReportTrendPanel({ rows }) {
  const trendRows = asList(rows);
  return (
    <div className="panel report-visual-panel report-trend-panel">
      <div className="panel-head report-trend-head">
        <div>
          <h3>기간 내 환경 추이</h3>
          <p>리포트 발급 조건에 해당하는 환경 로그를 평균·최저·최고와 함께 비교합니다.</p>
        </div>
        <span>{trendRows.length}건 기준</span>
      </div>
      {trendRows.length === 0 ? (
        <div className="report-empty-visual">선택 기간의 환경 로그가 없습니다.</div>
      ) : (
        <>
          <div className="report-trend-summary-grid">
            {TREND_METRICS.map((metric) => <TrendMetricSummary key={metric.key} metric={metric} rows={trendRows} />)}
          </div>
          <div className="report-trend-chart-grid">
            {TREND_METRICS.map((metric) => <ReportTrendChart key={metric.key} rows={trendRows} metric={metric} />)}
          </div>
        </>
      )}
    </div>
  );
}

function StatusDistributionPanel({ title, rows }) {
  const statusRows = STATUS_ORDER.map((status) => {
    const found = asList(rows).find((row) => row.status === status);
    return {
      status,
      label: STATUS_LABELS[status],
      count: Number(found?.count ?? 0),
      ratio: Number(found?.ratio ?? 0),
    };
  });
  const total = statusRows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="panel report-visual-panel">
      <div className="panel-head compact">
        <h3>{title}</h3>
        <p>전체 {total}건 기준</p>
      </div>
      {total === 0 ? (
        <div className="report-empty-visual">집계할 데이터가 없습니다.</div>
      ) : (
        <>
          <div className="report-status-bar" aria-label={`${title} 상태 분포`}>
            {statusRows.filter((row) => row.count > 0).map((row) => (
              <span
                key={row.status}
                className={`report-status-segment ${row.status.toLowerCase()}`}
                style={{ width: `${Math.max(row.ratio, 4)}%` }}
                title={`${row.label} ${row.count}건 (${row.ratio}%)`}
              />
            ))}
          </div>
          <div className="report-status-list">
            {statusRows.map((row) => (
              <div key={row.status}>
                <i className={`report-status-dot ${row.status.toLowerCase()}`} />
                <span>{row.label}</span>
                <strong>{row.count}건</strong>
                <small>{formatNumber(row.ratio)}%</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TopNonconformityPanel({ title, rows }) {
  const items = asList(rows);
  const maxCount = Math.max(...items.map((item) => Number(item.totalCount ?? 0)), 1);
  return (
    <div className="panel report-visual-panel">
      <div className="panel-head compact">
        <h3>{title}</h3>
        <p>주의/경고 발생 횟수 기준 TOP 항목</p>
      </div>
      {items.length === 0 ? (
        <div className="report-empty-visual">선택 기간의 부적합 항목이 없습니다.</div>
      ) : (
        <div className="report-top-nc-list">
          {items.map((item, index) => {
            const total = Number(item.totalCount ?? 0);
            const width = Math.max((total / maxCount) * 100, 8);
            return (
              <div key={`${item.itemCode}-${index}`} className="report-top-nc-row">
                <div className="report-top-nc-info">
                  <span>{index + 1}</span>
                  <div>
                    <strong>{item.itemName || item.itemCode}</strong>
                    <small>주의 {item.cautionCount ?? 0}건 · 경고 {item.failCount ?? 0}건</small>
                  </div>
                  <StatusBadge value={item.maxSeverity || "CAUTION"} />
                </div>
                <div className="report-top-nc-meter"><i style={{ width: `${width}%` }} /></div>
                <p>총 {total}건{item.maxDeviationRate != null ? ` · 최대 이탈률 ${formatNumber(item.maxDeviationRate)}%` : ""}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data: report, loading, error } = useApiData(() => greenqApi.report(reportId), [reportId]);
  const condition = useMemo(() => parseCondition(report?.generatedConditionJson), [report]);
  const deleteReport = async () => {
    if (!window.confirm("리포트를 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteReport(reportId);
    navigate("/reports");
  };

  if (loading) return <div className="panel"><p className="muted-text">리포트를 불러오는 중입니다...</p></div>;
  if (error || !report) return <EmptyState title="리포트를 찾을 수 없습니다." description={error || "잘못된 리포트 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/reports")}>리포트 목록으로</button>} />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Report Detail"
        title={report.reportTitle}
     
        actions={<><button className="secondary-button" onClick={() => navigate("/reports")}>목록으로</button>{isAdmin && <button className="danger-button" onClick={deleteReport}>삭제</button>}</>}
      />

      <div className="panel detail-hero report-hero">
        <div>
          <p className="eyebrow">{labelOf(report.reportType)} · {labelOf(report.reportScope)} · v{report.reportVersion || 1}</p>
          <h3>{report.targetName}</h3>
          <p>{report.startDate} ~ {report.endDate} · {report.createdAt}</p>
        </div>
        <StatusBadge value={report.reportStatus} />
      </div>

      <section className="report-kpi-grid">
        <div className="report-kpi-card"><span>환경 로그</span><strong>{condition?.envTotal ?? "-"}</strong><small>정상 {condition?.envNormal ?? "-"} / 주의 {condition?.envCaution ?? "-"} / 경고 {condition?.envFail ?? "-"}</small></div>
        <div className="report-kpi-card"><span>품질 실측</span><strong>{condition?.qualityTotal ?? "-"}</strong><small>정상 {condition?.qualityNormal ?? "-"} / 주의 {condition?.qualityCaution ?? "-"} / 경고 {condition?.qualityFail ?? "-"}</small></div>
        <div className="report-kpi-card"><span>환경 부적합</span><strong>{condition?.envNcTotal ?? "-"}</strong><small>조치 이력 {condition?.envActionTotal ?? "-"}건</small></div>
        <div className="report-kpi-card"><span>품질 부적합</span><strong>{condition?.qualityNcTotal ?? "-"}</strong><small>검토 {condition?.qualityReviewTotal ?? "-"}건 / 리포트 반영 {condition?.qualityReportReflectedTotal ?? "-"}건</small></div>
      </section>

      <ReportTrendPanel rows={report.environmentTrend} />

      <section className="content-grid two report-visual-grid">
        <StatusDistributionPanel title="환경 상태 분포" rows={report.envStatusDistribution} />
        <StatusDistributionPanel title="품질 상태 분포" rows={report.qualityStatusDistribution} />
        <TopNonconformityPanel title="환경 부적합 TOP 항목" rows={report.envTopNonconformityItems} />
        <TopNonconformityPanel title="품질 부적합 TOP 항목" rows={report.qualityTopNonconformityItems} />
      </section>

      <section className="content-grid two report-text-summary-grid">
        <SummaryPanel title="환경 요약">{report.envSummary}</SummaryPanel>
        <SummaryPanel title="품질 요약">{report.qualitySummary}</SummaryPanel>
        <SummaryPanel title="환경 부적합 요약">{report.envNcSummary}</SummaryPanel>
        <SummaryPanel title="품질 부적합 요약">{report.qualityNcSummary}</SummaryPanel>
      </section>

      <div className="panel report-guide-panel">
        <h3>관리 가이드</h3>
        <p>{report.guideSummary || "-"}</p>
      </div>

      <div className="panel report-condition-panel">
  <div className="panel-head">
    <h3>발급 조건 스냅샷</h3>
  </div>

  <div className="report-condition-grid">
    <div>
      <span>리포트 유형</span>
      <strong>{labelOf(condition?.reportType || report.reportType)}</strong>
    </div>

    <div>
      <span>범위</span>
      <strong>{labelOf(condition?.reportScope || report.reportScope)}</strong>
    </div>

    <div>
      <span>대상</span>
      <strong>{condition?.targetName || report.targetName}</strong>
    </div>

    <div>
      <span>기간</span>
      <strong>
        {report.startDate} ~ {report.endDate}
      </strong>
    </div>

    <div>
      <span>평균 온도</span>
      <strong>{condition?.envAvgTemp || "-"}℃</strong>
    </div>

    <div>
      <span>평균 습도</span>
      <strong>{condition?.envAvgHumidity || "-"}%</strong>
    </div>

    <div>
      <span>평균 pH</span>
      <strong>{condition?.envAvgPh || "-"}</strong>
    </div>

    <div>
      <span>평균 EC</span>
      <strong>{condition?.envAvgEc || "-"}</strong>
    </div>
  </div>
</div>
    </div>
  );
}
