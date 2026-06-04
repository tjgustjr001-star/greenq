import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { greenqApi } from "../api/greenqApi.js";
import { alertStatusLabel, issueStatusLabel, labelOf } from "../data/displayLabels.js";
import { asArray, useApiData } from "../hooks/useApiData.js";

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
  const openIssues = data?.openIssueCount ?? issues.length;
  const latestEnvValue = latestEnv.envStatus ? labelOf(latestEnv.envStatus) : "없음";
  const latestQualityValue = latestQuality.qualityStatus ? labelOf(latestQuality.qualityStatus) : "없음";

  if (loading) return <div className="panel"><p className="muted-text">DB 데이터를 불러오는 중입니다...</p></div>;

  return (
    <div className="page">
      <PageHeader eyebrow="Dashboard" title="대시보드" description="DB에 저장된 식물공장 운영 상태, 환경 이탈, 품질 실측 결과를 한눈에 확인합니다." actions={<><button className="secondary-button" onClick={() => navigate("/environment")}>환경 모니터링</button><button className="primary-button" onClick={() => navigate("/quality")}>실측 입력</button></>} />
      {error && <div className="notice-box danger">대시보드 데이터를 불러오지 못했습니다. 백엔드 서버와 DB 연결 상태를 확인해 주세요. {error}</div>}
      <section className="stat-grid dashboard-stat-grid">
        <StatCard label="운영 중 배치" value={data?.growingBatchCount ?? 0}  />
        <StatCard label="미확인 환경 알림" value={unreadAlerts} tone={unreadAlerts > 0 ? "red" : "green"} />
        <StatCard label="최근 환경 상태" value={latestEnvValue} hint={latestEnv.measuredAt || "-"} tone={latestEnv.envStatus === "FAIL" ? "red" : "green"} />
        <StatCard label="최근 품질 상태" value={latestQualityValue} hint={latestQuality.measuredAt || "-"} tone={latestQuality.qualityStatus === "FAIL" ? "red" : "blue"} />
        <StatCard label="미조치 부적합" value={openIssues} tone={openIssues > 0 ? "red" : "green"} />
        <StatCard label="등록 작물" value={data?.cropCount ?? 0}  />
      </section>

      <section className="dashboard-priority-grid">
        <button type="button" className={unreadAlerts > 0 ? "dashboard-priority-card danger" : "dashboard-priority-card"} onClick={() => navigate("/issues?type=env")}>
          <span>1순위</span>
          <strong>환경 알림 확인</strong>
          <p>{unreadAlerts > 0 ? `${unreadAlerts}건의 미확인 알림이 있습니다.` : "미확인 환경 알림이 없습니다."}</p>
        </button>
        <button type="button" className={openIssues > 0 ? "dashboard-priority-card danger" : "dashboard-priority-card"} onClick={() => navigate("/issues")}>
          <span>2순위</span>
          <strong>부적합 조치 점검</strong>
          <p>{openIssues > 0 ? `${openIssues}건의 미조치 부적합이 있습니다.` : "미조치 부적합이 없습니다."}</p>
        </button>
        <button type="button" className="dashboard-priority-card" onClick={() => navigate("/reports")}>
          <span>마감</span>
          <strong>리포트 발급</strong>
          <p>환경·품질·부적합 데이터를 기준으로 운영 리포트를 확인합니다.</p>
        </button>
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
        <div className="panel"><div className="panel-head"><h3>최근 환경 로그</h3><button className="text-button" onClick={() => navigate("/environment")}>전체 보기</button></div><table><thead><tr><th>측정시각</th><th>배치</th><th>온도</th><th>pH</th><th>상태</th></tr></thead><tbody>{logs.length === 0 ? <tr><td colSpan={5} className="empty-table-cell">최근 환경 로그가 없습니다.</td></tr> : logs.slice(0, 5).map((log) => <tr key={log.envLogId} onClick={() => navigate(`/environment/logs/${log.envLogId}`)}><td>{log.measuredAt}</td><td>{log.batchName}</td><td>{log.temperature}℃</td><td>{log.ph}</td><td><StatusBadge value={log.envStatus} /></td></tr>)}</tbody></table></div>
        <div className="panel"><div className="panel-head"><h3>최근 부적합</h3><button className="text-button" onClick={() => navigate("/issues")}>전체 보기</button></div>{issues.length === 0 ? <p className="muted-text">최근 부적합 이력이 없습니다.</p> : <div className="issue-list">{issues.slice(0, 5).map((issue) => <button key={`${issue.issueType}-${issue.issueId}`} className="issue-card" onClick={() => navigate(issueTarget(issue))}><div><strong>{issue.zoneName} · {issue.itemName}</strong><p>{issue.measuredValue} / 기준 {issue.standardRange}</p></div><StatusBadge value={issue.severity} /></button>)}</div>}</div>
      </section>
    </div>
  );
}
