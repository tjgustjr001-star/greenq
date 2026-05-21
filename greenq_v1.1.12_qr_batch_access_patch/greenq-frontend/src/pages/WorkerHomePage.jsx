import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { greenqApi } from "../api/greenqApi.js";
import { alertStatusLabel, issueStatusLabel, labelOf } from "../data/displayLabels.js";
import { asArray, useApiData } from "../hooks/useApiData.js";
import { getCurrentUser } from "../utils/auth.js";

function issueTarget(issue) {
  const rawId = issue.rawId || String(issue.issueId || "").replace(/^(ENV|QLT)-/i, "");
  const type = String(issue.issueType || "env").toLowerCase() === "quality" ? "quality" : "env";
  return `/issues/${type}/${rawId}`;
}

function alertTarget(alert) {
  const rawId = alert.rawId || alert.envNcId || String(alert.issueId || "").replace(/^(ENV|QLT)-/i, "");
  return `/issues/env/${rawId}`;
}

export default function WorkerHomePage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user.userId || user.id || "";
  const { data, loading, error, reload } = useApiData(() => greenqApi.workerHome(userId), [userId]);

  const needMeasurements = asArray(data?.todayMeasurementRequiredBatches);
  const alerts = asArray(data?.unreadAlerts);
  const actionIssues = asArray(data?.actionNeededIssues);
  const myMeasurements = asArray(data?.myRecentMeasurements);
  const myActions = asArray(data?.myActionLogs);

  const openAlert = async (alert) => {
    if (alert.alertId) {
      await greenqApi.markEnvAlertRead(alert.alertId, { userId });
      await reload();
    }
    navigate(alertTarget(alert));
  };

  if (loading) return <div className="panel"><p className="muted-text">작업자 홈 데이터를 불러오는 중입니다...</p></div>;

  return (
    <div className="page worker-home-page">
      <PageHeader
        eyebrow="Worker Home"
        title="작업자 홈"
        description="오늘 처리해야 할 실측 입력, 미확인 알림, 조치 필요 부적합과 내 작업 이력을 확인합니다."
        actions={(
          <>
            <button className="secondary-button" onClick={() => navigate("/environment")}>환경 확인</button>
            <button className="primary-button" onClick={() => navigate("/quality/new")}>실측 입력</button>
          </>
        )}
      />

      {error && <div className="notice-box">{error}</div>}

      <section className="stat-grid worker-stat-grid">
        <StatCard label="오늘 실측 필요" value={data?.measurementRequiredCount ?? needMeasurements.length} hint="GROWING 배치 중 오늘 미입력" />
        <StatCard label="미확인 알림" value={data?.unreadAlertCount ?? alerts.length} hint="ENV_ALERT UNREAD" tone="red" />
        <StatCard label="조치 필요" value={data?.actionNeededCount ?? actionIssues.length} hint="OPEN / IN_PROGRESS" tone="orange" />
        <StatCard label="내 최근 실측" value={myMeasurements.length} hint="최근 입력 기준" tone="blue" />
        <StatCard label="내 조치 이력" value={myActions.length} hint="최근 조치 기준" tone="green" />
      </section>

      <section className="content-grid two worker-home-grid">
        <div className="panel">
          <div className="panel-head">
            <div><h3>오늘 실측 필요 배치</h3><p>오늘 실측 데이터가 아직 없는 운영 중 배치입니다.</p></div>
            <button className="text-button" onClick={() => navigate("/quality/new")}>실측 입력</button>
          </div>
          {needMeasurements.length === 0 ? <p className="worker-empty">오늘 실측이 필요한 배치가 없습니다.</p> : (
            <div className="worker-task-list">
              {needMeasurements.map((batch) => (
                <button key={`need-${batch.batchId}`} className="worker-task-card" onClick={() => navigate(`/quality/new?batchId=${batch.batchId}`)}>
                  <div>
                    <strong>{batch.zoneName} · {batch.batchName}</strong>
                    <p>{batch.cropName} / {labelOf(batch.batchStatus)} / 마지막 실측 {batch.lastMeasuredAt || "없음"}</p>
                  </div>
                  <span>입력하기</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>미확인 환경 알림</h3><p>아직 읽지 않은 환경 부적합 알림입니다.</p></div>
            <button className="text-button" onClick={() => navigate("/issues?type=env")}>전체 보기</button>
          </div>
          {alerts.length === 0 ? <p className="worker-empty">미확인 환경 알림이 없습니다.</p> : (
            <div className="issue-list">
              {alerts.map((alert) => (
                <button key={`worker-alert-${alert.alertId}`} className="issue-card" onClick={() => openAlert(alert)}>
                  <div>
                    <strong>{alert.zoneName} · {alert.itemName}</strong>
                    <p>{alert.alertMessage || `${alert.measuredValue} / 기준 ${alert.standardRange}`}</p>
                    <small>{alert.createdAt} · {alertStatusLabel(alert.alertStatus)}</small>
                  </div>
                  <StatusBadge value={alert.alertLevel || alert.severity} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>조치 필요 부적합</h3><p>해결되지 않은 환경 부적합입니다.</p></div>
            <button className="text-button" onClick={() => navigate("/issues?type=env")}>조치 목록</button>
          </div>
          {actionIssues.length === 0 ? <p className="worker-empty">현재 조치가 필요한 부적합이 없습니다.</p> : (
            <div className="issue-list">
              {actionIssues.map((issue) => (
                <button key={`action-${issue.issueId}`} className="issue-card" onClick={() => navigate(issueTarget(issue))}>
                  <div>
                    <strong>{issue.zoneName} · {issue.itemName}</strong>
                    <p>{issue.batchName} / {issue.measuredValue} / 기준 {issue.standardRange}</p>
                    <small>{issue.occurredAt} · {issueStatusLabel("env", issue.status)}</small>
                  </div>
                  <StatusBadge value={issue.severity} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>내 최근 실측</h3><p>내 계정으로 등록된 최근 실측 데이터입니다.</p></div>
            <button className="text-button" onClick={() => navigate("/quality")}>실측 목록</button>
          </div>
          {myMeasurements.length === 0 ? <p className="worker-empty">아직 내가 등록한 실측 데이터가 없습니다.</p> : (
            <table>
              <thead><tr><th>측정일시</th><th>배치</th><th>샘플</th><th>품질</th></tr></thead>
              <tbody>{myMeasurements.map((m) => (
                <tr key={`my-m-${m.measurementId}`} onClick={() => navigate(`/quality/${m.measurementId}`)}>
                  <td>{m.measuredAt}</td><td><strong>{m.batchName}</strong><br /><small>{m.zoneName}</small></td><td>{m.sampleCount}</td><td><StatusBadge value={m.qualityStatus} /></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        <div className="panel worker-wide-panel">
          <div className="panel-head">
            <div><h3>내 조치 이력</h3><p>내 계정으로 등록한 환경 조치 메모입니다.</p></div>
            <button className="text-button" onClick={() => navigate("/issues?type=env")}>부적합 이력</button>
          </div>
          {myActions.length === 0 ? <p className="worker-empty">아직 내가 작성한 조치 이력이 없습니다.</p> : (
            <table>
              <thead><tr><th>조치일시</th><th>구역/배치</th><th>항목</th><th>조치내용</th><th>처리상태</th></tr></thead>
              <tbody>{myActions.map((a) => (
                <tr key={`my-a-${a.actionId}`} onClick={() => navigate(`/issues/env/${a.envNcId}`)}>
                  <td>{a.actionAt}</td>
                  <td><strong>{a.zoneName}</strong><br /><small>{a.batchName}</small></td>
                  <td>{a.itemName}</td>
                  <td>{a.actionContent || a.resultNote || "-"}</td>
                  <td><StatusBadge value={a.actionStatusAfter} /></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
