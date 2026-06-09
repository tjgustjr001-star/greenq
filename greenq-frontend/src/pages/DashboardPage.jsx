import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CheckCircle, FileText } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { greenqApi } from "../api/greenqApi.js";
import { alertStatusLabel, issueStatusLabel, labelOf } from "../data/displayLabels.js";
import { asArray, useApiData } from "../hooks/useApiData.js";
import { formatNumber, formatNumberText } from "../utils/numberFormat.js";

function alertTarget(alert) {
  const rawId = alert.rawId || alert.envNcId || String(alert.issueId || "").replace(/^(ENV|QLT)-/i, "");
  return rawId ? `/issues/env/${rawId}` : "/issues?type=env";
}

function issueTarget(issue) {
  const type = String(issue.issueType).toLowerCase() === "quality" ? "quality" : "env";
  const rawId = issue.rawId || String(issue.issueId || "").replace(/^(ENV|QLT)-/i, "");
  return rawId ? `/issues/${type}/${rawId}` : "/issues";
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
  const unreadAlerts = data?.unreadEnvAlertCount ?? alerts.length;
  const openIssues = data?.actionRequiredIssueCount ?? data?.openIssueCount ?? issues.length;
  const envOpenIssues = data?.envOpenIssueCount ?? 0;
  const qualityRecordedIssues = data?.qualityRecordedIssueCount ?? 0;
  const issueHint = `환경 미해결 ${envOpenIssues}건 · 품질 검토대기 ${qualityRecordedIssues}건`;
  const hasUnreadEnvAlerts = unreadAlerts > 0;
  const hasPendingIssues = openIssues > 0;
  const actionCards = [
    hasUnreadEnvAlerts && {
      key: "alerts",
      badge: "확인 필요",
      title: "환경 알림 확인",
      desc: `미확인 환경 알림 ${unreadAlerts}건이 있습니다.`,
      icon: Bell,
      danger: true,
      onClick: () => navigate("/issues?type=env"),
    },
    hasPendingIssues && {
      key: "issues",
      badge: "처리 필요",
      title: "처리 필요 부적합",
      desc: issueHint,
      icon: AlertTriangle,
      danger: true,
      onClick: () => navigate("/issues"),
    },
  ].filter(Boolean);
  const latestEnvValue = latestEnv.envStatus ? labelOf(latestEnv.envStatus) : "없음";
  const latestQualityValue = latestQuality.qualityStatus ? labelOf(latestQuality.qualityStatus) : "없음";

  if (loading) return <div className="panel"><p className="muted-text">대시보드 데이터를 불러오는 중입니다...</p></div>;

  return (
    <div className="page">
      <PageHeader eyebrow="Dashboard" title="대시보드" description="식물공장 운영 상태, 환경 이탈, 품질 실측 결과를 한눈에 확인합니다." actions={<><button className="secondary-button" onClick={() => navigate("/environment")}>환경 모니터링</button><button className="primary-button" onClick={() => navigate("/quality")}>실측 입력</button></>} />
      {error && <div className="notice-box danger">대시보드 데이터를 불러오지 못했습니다. 서버 연결 상태를 확인해 주세요. {error}</div>}
      <section className="stat-grid dashboard-stat-grid">
        <StatCard label="운영 중 배치" value={data?.growingBatchCount ?? 0}  />
        <StatCard label="미확인 환경 알림" value={unreadAlerts} tone={unreadAlerts > 0 ? "red" : "green"} />
        <StatCard label="최근 환경 상태" value={latestEnvValue} hint={latestEnv.measuredAt || "-"} tone={latestEnv.envStatus === "FAIL" ? "red" : "green"} />
        <StatCard label="최근 품질 상태" value={latestQualityValue} hint={latestQuality.measuredAt || "-"} tone={latestQuality.qualityStatus === "FAIL" ? "red" : "blue"} />
        <StatCard label="처리 필요 부적합" value={openIssues} hint={issueHint} tone={openIssues > 0 ? "red" : "green"} />
        <StatCard label="등록 작물" value={data?.cropCount ?? 0}  />
      </section>

      {actionCards.length > 0 ? (
        <section className="dashboard-priority-grid">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <button key={card.key} type="button" className={card.danger ? "dashboard-priority-card danger" : "dashboard-priority-card"} onClick={card.onClick}>
                <span className="dashboard-priority-icon"><Icon size={18} /></span>
                <div>
                  <em>{card.badge}</em>
                  <strong>{card.title}</strong>
                  <p>{card.desc}</p>
                </div>
              </button>
            );
          })}
        </section>
      ) : (
        <section className="dashboard-action-banner">
          <div className="dashboard-action-copy">
            <span className="dashboard-action-kicker"><CheckCircle size={16} />운영 상태</span>
            <h3>현재 처리할 주요 항목이 없습니다</h3>
            <p>미확인 환경 알림과 품질 검토대기 항목이 없습니다. 최근 환경 로그와 리포트를 확인해 운영 상태를 점검하세요.</p>
          </div>
          <div className="dashboard-action-buttons">
            <button className="secondary-button" onClick={() => navigate("/environment")}>환경 모니터링</button>
            <button className="primary-button" onClick={() => navigate("/reports")}><FileText size={16} />리포트 보기</button>
          </div>
        </section>
      )}

      <section className="content-grid two">
        <div className="panel">
          <div className="panel-head"><h3>미확인 환경 알림</h3><button className="text-button" onClick={() => navigate("/issues?type=env")}>전체 보기</button></div>
          {alerts.length === 0 ? <p className="muted-text">미확인 환경 알림이 없습니다.</p> : <div className="issue-list">{alerts.slice(0, 5).map((alert) => (
            <button key={`dashboard-alert-${alert.alertId}`} className="issue-card" onClick={() => navigate(alertTarget(alert))}>
              <div><strong>{alert.zoneName} · {alert.itemName}</strong><p>{alert.alertMessage ? formatNumberText(alert.alertMessage) : `${formatNumber(alert.measuredValue)} / 기준 ${formatNumberText(alert.standardRange)}`}</p><small>{alert.createdAt} · {issueStatusLabel("env", alert.status)} · {alertStatusLabel(alert.alertStatus)}</small></div>
              <StatusBadge value={alert.alertLevel || alert.severity} />
            </button>
          ))}</div>}
        </div>
        <div className="panel"><div className="panel-head"><h3>최근 환경 로그</h3><button className="text-button" onClick={() => navigate("/environment")}>전체 보기</button></div><table><thead><tr><th>측정시각</th><th>배치</th><th>온도</th><th>pH</th><th>상태</th></tr></thead><tbody>{logs.length === 0 ? <tr><td colSpan={5} className="empty-table-cell">최근 환경 로그가 없습니다.</td></tr> : logs.slice(0, 5).map((log) => <tr key={log.envLogId} onClick={() => navigate(`/environment/logs/${log.envLogId}`)}><td>{log.measuredAt}</td><td>{log.batchName}</td><td>{formatNumber(log.temperature)}℃</td><td>{formatNumber(log.ph)}</td><td><StatusBadge value={log.envStatus} /></td></tr>)}</tbody></table></div>
        <div className="panel"><div className="panel-head"><h3>최근 부적합</h3><button className="text-button" onClick={() => navigate("/issues")}>전체 보기</button></div>{issues.length === 0 ? <p className="muted-text">최근 부적합 이력이 없습니다.</p> : <div className="issue-list">{issues.slice(0, 5).map((issue) => <button key={`${issue.issueType}-${issue.issueId}`} className="issue-card" onClick={() => navigate(issueTarget(issue))}><div><strong>{issue.zoneName} · {issue.itemName}</strong><p>{formatNumber(issue.measuredValue)} / 기준 {formatNumberText(issue.standardRange)}</p></div><StatusBadge value={issue.severity} /></button>)}</div>}</div>
      </section>
    </div>
  );
}
