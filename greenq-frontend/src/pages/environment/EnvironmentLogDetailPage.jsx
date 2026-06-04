import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { labelOf } from "../../data/displayLabels.js";
import { useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

function statusOf(item) {
  return item.status || item.evalStatus || "-";
}

function statusCount(items, status) {
  return items.filter((item) => statusOf(item) === status).length;
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2).replace(/\.00$/, "").replace(/0$/, "");
}

function formatValue(value, unit = "") {
  if (value === null || value === undefined || value === "") return "-";
  return `${formatNumber(value)}${unit || ""}`;
}

function formatMeasuredValue(item) {
  const value = item.measuredValue ?? item.measuredTextValue;
  if (value === null || value === undefined || value === "") return "-";
  if (item.measuredTextValue && item.measuredValue === null) return item.measuredTextValue;
  return `${formatNumber(value)}${item.unit || ""}`;
}

function formatStandard(item) {
  const standard = item.standard || item.standardRange;
  if (!standard || standard === "-") return "-";
  return `${standard}${item.unit || ""}`;
}

function formatDeviation(value) {
  if (value === null || value === undefined || value === "") return "-";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return `${formatNumber(numeric)}%`;
}

function guideFor(item) {
  if (item.guide || item.guideMessage) return item.guide || item.guideMessage;
  const status = statusOf(item);
  if (status === "SKIPPED") return "표시용 항목으로 자동 판정에서 제외됩니다.";
  if (status === "MISSING") return "측정값 또는 기준값을 확인하세요.";
  if (status === "CAUTION") return "기준 범위 이탈 여부를 확인하세요.";
  if (status === "FAIL") return "즉시 조치가 필요한 경고 항목입니다.";
  return "-";
}

export default function EnvironmentLogDetailPage() {
  const { envLogId } = useParams();
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data: log, loading, error } = useApiData(() => greenqApi.environmentLog(envLogId), [envLogId]);
  const items = useMemo(() => log?.items || [], [log]);
  const itemSummary = useMemo(() => ({
    normal: statusCount(items, "NORMAL"),
    caution: statusCount(items, "CAUTION"),
    fail: statusCount(items, "FAIL"),
    missing: statusCount(items, "MISSING"),
    skipped: statusCount(items, "SKIPPED"),
  }), [items]);

  const deleteLog = async () => {
    if (!window.confirm("환경 데이터를 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteEnvironmentLog(envLogId);
    navigate("/environment");
  };

  if (loading) return <div className="panel"><p className="muted-text">환경 로그를 불러오는 중입니다...</p></div>;
  if (error || !log) {
    return (
      <EmptyState
        title="환경 로그를 찾을 수 없습니다."
        description={error || "잘못된 환경 로그 ID입니다."}
        action={<button className="primary-button" onClick={() => navigate("/environment")}>환경 목록으로</button>}
      />
    );
  }

  return (
    <div className="page environment-detail-page">
      <PageHeader
        eyebrow="Environment Log"
        title={`${log.batchName} 환경 로그`}
        description="환경 로그와 항목별 판정 결과를 확인합니다."
        actions={(
          <>
            <button className="secondary-button" onClick={() => navigate("/environment")}>목록으로</button>
            {isAdmin && <button className="danger-button" onClick={deleteLog}>삭제</button>}
          </>
        )}
      />

      <div className="panel detail-hero environment-detail-hero">
        <div>
          <p className="eyebrow">{log.zoneName} · {log.batchName}</p>
          <h3>{log.measuredAt}</h3>
          <p>데이터 출처: {log.dataSource || "-"}</p>
        </div>
        <div className="badge-stack">
          <StatusBadge value={log.envStatus} />
          <small>종합 판정: {labelOf(log.envStatus)}</small>
        </div>
      </div>

      <section className="content-grid three">
        <div className="panel info-panel">
          <h3>공기환경</h3>
          <dl>
            <dt>온도</dt><dd>{formatValue(log.temperature, "℃")}</dd>
            <dt>습도</dt><dd>{formatValue(log.humidity, "%")}</dd>
            <dt>CO2</dt><dd>{formatValue(log.co2)}</dd>
            <dt>VPD</dt><dd>{formatValue(log.vpd)}</dd>
          </dl>
        </div>
        <div className="panel info-panel">
          <h3>양액환경</h3>
          <dl>
            <dt>pH</dt><dd>{formatValue(log.ph)}</dd>
            <dt>EC</dt><dd>{formatValue(log.ec)}</dd>
            <dt>수온</dt><dd>{formatValue(log.waterTemp, "℃")}</dd>
          </dl>
        </div>
        <div className="panel info-panel">
          <h3>광환경</h3>
          <dl>
            <dt>광량</dt><dd>{formatValue(log.lightIntensity)}</dd>
            <dt>광주기</dt><dd>{formatValue(log.photoperiod, "h")}</dd>
            <dt>파장</dt><dd>{log.lightWavelength || "-"}</dd>
          </dl>
        </div>
      </section>

      <section className="stat-grid environment-item-stat-grid">
        <StatCard label="정상 항목" value={itemSummary.normal} tone="green" />
        <StatCard label="주의 항목" value={itemSummary.caution} tone="orange" />
        <StatCard label="경고 항목" value={itemSummary.fail} tone="red" />
        <StatCard label="누락 항목" value={itemSummary.missing} tone="blue" />
        <StatCard label="제외 항목" value={itemSummary.skipped} tone="blue" />
      </section>

      <div className="panel environment-evaluation-panel">
        <div className="panel-head">
          <div>
            <h3>항목별 판정</h3>
            <p className="panel-desc">판정 당시 기준값 스냅샷과 측정값을 함께 표시합니다.</p>
          </div>
          <span className="table-count">{items.length}개 항목</span>
        </div>
        {items.length === 0 ? (
          <EmptyState title="항목별 판정 결과가 없습니다." description="해당 환경 로그에 연결된 평가 항목이 없습니다." />
        ) : (
          <table className="data-table environment-evaluation-table">
            <colgroup>
              <col className="col-item" />
              <col className="col-value" />
              <col className="col-standard" />
              <col className="col-small" />
              <col className="col-status" />
              <col className="col-guide" />
            </colgroup>
            <thead>
              <tr>
                <th>항목</th>
                <th>측정값</th>
                <th>기준</th>
                <th>이탈률</th>
                <th>상태</th>
                <th>가이드</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.envEvalItemId || item.itemCode || item.itemName} className={`evaluation-row ${String(statusOf(item)).toLowerCase()}`}>
                  <td className="text-left">
                    <strong>{item.itemName}</strong>
                  </td>
                  <td>{formatMeasuredValue(item)}</td>
                  <td className="text-left"><span className="table-text-wrap">{formatStandard(item)}</span></td>
                  <td>{formatDeviation(item.deviationRate)}</td>
                  <td><StatusBadge value={statusOf(item)} /></td>
                  <td className="text-left guide-cell"><span className="table-text-wrap">{guideFor(item)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
