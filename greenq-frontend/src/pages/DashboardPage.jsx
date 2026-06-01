import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { greenqApi } from "../api/greenqApi.js";
import { alertStatusLabel, issueStatusLabel, labelOf } from "../data/displayLabels.js";
import { asArray, useApiData } from "../hooks/useApiData.js";

function alertTarget(alert) {
  const rawId = alert.rawId || alert.envNcId || String(alert.issueId || "").replace(/^(ENV|QLT)-/i, "");
  return `/issues/env/${rawId}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useApiData(() => greenqApi.dashboard(), []);
  const logs = asArray(data?.latestEnvironmentLogs);
  const issues = asArray(data?.recentIssues);
  const measurements = asArray(data?.recentMeasurements);
  const alerts = asArray(data?.unreadEnvAlerts || data?.recentEnvAlerts);
  const latestEnv = logs[0] || {};
  const latestQuality = measurements[0] || {};

  if (loading) return <div className="panel"><p className="muted-text">DB 데이터를 불러오는 중입니다...</p></div>;
  if (error) return <div className="notice-box">{error}</div>;

  return (
    <div className="page">
      <PageHeader eyebrow="Dashboard" title="대시보드" description="DB에 저장된 식물공장 운영 상태, 환경 이탈, 품질 실측 결과를 한눈에 확인합니다." actions={<><button className="secondary-button" onClick={() => navigate("/environment")}>환경 모니터링</button><button className="primary-button" onClick={() => navigate("/quality")}>실측 입력</button></>} />
      <section className="stat-grid dashboard-stat-grid">
        <StatCard label="운영 중 배치" value={data?.growingBatchCount ?? 0}  />
        <StatCard label="미확인 환경 알림" value={data?.unreadEnvAlertCount ?? 0} tone="red" />
        <StatCard label="최근 환경 상태" value={labelOf(latestEnv.envStatus) || "없음"} hint={latestEnv.measuredAt || "-"} tone="green" />
        <StatCard label="최근 품질 상태" value={labelOf(latestQuality.qualityStatus) || "없음"} hint={latestQuality.measuredAt || "-"} tone="blue" />
        <StatCard label="미조치 부적합" value={data?.openIssueCount ?? 0}  tone="red" />
        <StatCard label="등록 작물" value={data?.cropCount ?? 0}  />
      </section>
      <section className="content-grid two">
        <div className="panel">
          <div className="panel-head"><h3>미확인 환경 알림</h3><button className="text-button" onClick={() => navigate("/issues?type=env")}>전체 보기</button></div>
          {alerts.length === 0 ? <p className="muted-text">미확인 환경 알림이 없습니다.</p> : <div className="issue-list">{alerts.slice(0, 5).map((alert) => (
            <button key={`dashboard-alert-${alert.alertId}`} className="issue-card" onClick={() => navigate(alertTarget(alert))}>
              <div><strong>{alert.zoneName} · {alert.itemName}</strong><p>{alert.alertMessage || `${alert.measuredValue} / 기준 ${alert.standardRange}`}</p><small>{alert.createdAt} · {issueStatusLabel("env", alert.status)} · {alertStatusLabel(alert.alertStatus)}</small></div>
              <StatusBadge value={alert.alertLevel || alert.severity} />
            </button>
          ))}</div>}
        </div>
        <div className="panel"><div className="panel-head"><h3>최근 환경 로그</h3><button className="text-button" onClick={() => navigate("/environment")}>전체 보기</button></div><table><thead><tr><th>측정시각</th><th>배치</th><th>온도</th><th>pH</th><th>상태</th></tr></thead><tbody>{logs.slice(0, 5).map((log) => <tr key={log.envLogId} onClick={() => navigate(`/environment/logs/${log.envLogId}`)}><td>{log.measuredAt}</td><td>{log.batchName}</td><td>{log.temperature}℃</td><td>{log.ph}</td><td><StatusBadge value={log.envStatus} /></td></tr>)}</tbody></table></div>
        <div className="panel"><div className="panel-head"><h3>최근 부적합</h3><button className="text-button" onClick={() => navigate("/issues")}>전체 보기</button></div><div className="issue-list">{issues.slice(0, 5).map((issue) => <button key={`${issue.issueType}-${issue.issueId}`} className="issue-card" onClick={() => navigate(`/issues/${String(issue.issueType).toLowerCase() === "quality" ? "quality" : "env"}/${issue.rawId || String(issue.issueId).replace(/^(ENV|QLT)-/i, "")}`)}><div><strong>{issue.zoneName} · {issue.itemName}</strong><p>{issue.measuredValue} / 기준 {issue.standardRange}</p></div><StatusBadge value={issue.severity} /></button>)}</div></div>
      </section>
    </div>
  );
}
