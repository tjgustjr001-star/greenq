import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { alertStatusLabel, issueStatusLabel } from "../../data/displayLabels.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

function normalizeType(value) { return String(value || "").toLowerCase() === "quality" ? "quality" : "env"; }
function currentUserId(user) { return user?.userId || user?.id || null; }

export default function IssueDetailPage() {
  const { issueType, issueId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAdmin = (user.role || user.roleCode) === "ADMIN";
  const type = normalizeType(issueType);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionContent, setActionContent] = useState("");
  const [actionStatusAfter, setActionStatusAfter] = useState("IN_PROGRESS");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewStatusAfter, setReviewStatusAfter] = useState("REVIEWED");

  const { data, loading, error, reload } = useApiData(async () => {
    const issue = await greenqApi.issue(`${type === "env" ? "ENV" : "QLT"}-${issueId}`);
    const actions = type === "env" ? await greenqApi.issueActions(issueId).catch(() => []) : [];
    const alerts = type === "env" ? await greenqApi.envAlerts({ envNcId: issueId }).catch(() => []) : [];
    const reviews = type === "quality" ? await greenqApi.qualityIssueReviews(issueId).catch(() => []) : [];
    return { issue: { ...issue, issueType: type }, actions, alerts, reviews };
  }, [type, issueId]);

  const issue = data?.issue;
  const actions = asArray(data?.actions);
  const alerts = asArray(data?.alerts);
  const reviews = asArray(data?.reviews);

  const resetActionForm = () => { setActionContent(""); setActionStatusAfter("IN_PROGRESS"); setActionModalOpen(false); };
  const resetReviewForm = () => { setReviewContent(""); setReviewStatusAfter("REVIEWED"); setReviewModalOpen(false); };

  const saveAction = async () => {
    if (!actionContent.trim()) return;
    await greenqApi.createIssueAction(issueId, { actionContent, actionStatusAfter, actionType: "CHECKED", actionBy: currentUserId(user) });
    resetActionForm();
    await reload();
  };

  const saveReview = async () => {
    if (!reviewContent.trim()) return;
    await greenqApi.createQualityIssueReview(issueId, { reviewContent, reviewStatusAfter, reviewedBy: currentUserId(user) });
    resetReviewForm();
    await reload();
  };

  const markAlertsRead = async () => {
    await greenqApi.markEnvIssueAlertsRead(issueId, { userId: currentUserId(user) });
    await reload();
  };

  const closeAlerts = async () => {
    await greenqApi.closeEnvIssueAlerts(issueId, { userId: currentUserId(user) });
    await reload();
  };

  const deleteIssue = async () => {
    if (!window.confirm("부적합 이력을 DB에서 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteIssue(type, issueId);
    navigate("/issues");
  };

  if (loading) return <div className="panel"><p className="muted-text">부적합 상세를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !issue) return <EmptyState title="부적합 이력을 찾을 수 없습니다." description={error || "잘못된 부적합 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/issues")}>부적합 목록으로</button>} />;

  const activeAlertCount = alerts.filter((alert) => String(alert.alertStatus).toUpperCase() !== "CLOSED").length;
  const unreadAlertCount = alerts.filter((alert) => String(alert.alertStatus).toUpperCase() === "UNREAD").length;
  const qualityReflected = String(issue.reportReflectedYn || "N").toUpperCase() === "Y";

  return (
    <div className="page">
      <PageHeader
        eyebrow="Nonconformity Detail"
        title={`${issue.zoneName} · ${issue.itemName}`}
        description="DB에 저장된 부적합 상세와 조치/검토 이력을 확인합니다."
        actions={<><button className="secondary-button" onClick={() => navigate("/issues")}>목록으로</button>{type === "env" && <button className="primary-button" onClick={() => setActionModalOpen(true)}><Plus size={16} />조치 메모</button>}{type === "quality" && <button className="primary-button" onClick={() => setReviewModalOpen(true)}><Plus size={16} />검토 메모</button>}{isAdmin && <button className="danger-button" onClick={deleteIssue}>삭제</button>}</>}
      />

      <div className="panel detail-hero">
        <div><p className="eyebrow">{type === "env" ? "환경 부적합" : "품질 부적합"}</p><h3>{issue.batchName}</h3><p>{issue.occurredAt} · 기준 {issue.standardRange}</p></div>
        <div className="badge-stack"><div className="inline-actions"><StatusBadge value={issue.severity} /><span className={`status-badge ${String(issue.status || "").toLowerCase()}`}>{issueStatusLabel(type, issue.status)}</span></div>{type === "quality" && <span className={`status-badge ${qualityReflected ? "reflected" : "recorded"}`}>{qualityReflected ? "리포트 반영" : "리포트 미반영"}</span>}</div>
      </div>

      <section className="content-grid two">
        <div className="panel info-panel"><h3>부적합 정보</h3><dl><dt>측정값</dt><dd>{issue.measuredValueDisplay ?? issue.measuredTextValue ?? issue.measuredValue ?? "-"}</dd><dt>기준 최소</dt><dd>{issue.standardMin ?? "-"}</dd><dt>기준 최대</dt><dd>{issue.standardMax ?? "-"}</dd><dt>이탈률</dt><dd>{issue.deviationRate ?? "-"}</dd>{type === "quality" && <><dt>실측 ID</dt><dd>{issue.measurementId ? <button className="text-button" onClick={() => navigate(`/quality/${issue.measurementId}`)}>#{issue.measurementId} 실측 상세</button> : "-"}</dd><dt>검토 이력</dt><dd>{issue.reviewCount ?? reviews.length}건</dd><dt>최근 검토</dt><dd>{issue.latestReviewAt || "-"}</dd></>}</dl></div>
        <div className="panel info-panel"><h3>{type === "quality" ? "품질 검토/리포트 연결" : "권장 조치"}</h3>{type === "quality" ? <dl><dt>현재 상태</dt><dd>{issueStatusLabel("quality", issue.status)}</dd><dt>리포트 반영</dt><dd>{qualityReflected ? "반영 완료" : "미반영"}</dd><dt>다음 작업</dt><dd>{qualityReflected ? "리포트 재발급 시 품질 요약에 반영됩니다." : "검토 메모에서 상태를 리포트반영으로 저장하세요."}</dd></dl> : <p>{issue.guide || issue.guideMessage || "-"}</p>}</div>
      </section>

      {type === "env" && (
        <div className="panel">
          <div className="panel-head">
            <div><h3>환경 알림</h3><p className="panel-desc">미확인 {unreadAlertCount}건 · 활성 {activeAlertCount}건</p></div>
            <div className="inline-actions"><button className="secondary-button" onClick={markAlertsRead} disabled={activeAlertCount === 0}>읽음 처리</button><button className="danger-button" onClick={closeAlerts} disabled={activeAlertCount === 0}>알림 닫기</button></div>
          </div>
          {alerts.length === 0 ? <p className="muted-text">연결된 환경 알림이 없습니다.</p> : <table className="data-table issue-alert-table"><colgroup><col className="col-date" /><col className="col-title" /><col className="col-status" /><col className="col-status" /><col className="col-content" /></colgroup><thead><tr><th>생성일시</th><th>제목</th><th>수준</th><th>상태</th><th>내용</th></tr></thead><tbody>{alerts.map((alert) => <tr key={alert.alertId}><td>{alert.createdAt}</td><td className="text-left"><span className="table-text-wrap">{alert.alertTitle}</span></td><td><StatusBadge value={alert.alertLevel} /></td><td><span className={`status-badge ${String(alert.alertStatus || "").toLowerCase()}`}>{alertStatusLabel(alert.alertStatus)}</span></td><td className="text-left"><span className="table-text-wrap">{alert.alertMessage}</span></td></tr>)}</tbody></table>}
        </div>
      )}

      {type === "env" && (
        <div className="panel">
          <div className="panel-head"><h3>조치 이력</h3><button className="secondary-button" onClick={() => setActionModalOpen(true)}>조치 메모 등록</button></div>
          {actions.length === 0 ? <p className="muted-text">등록된 조치 이력이 없습니다.</p> : <table className="data-table issue-action-table"><colgroup><col className="col-date" /><col className="col-status" /><col className="col-content" /><col className="col-status" /><col className="col-note" /></colgroup><thead><tr><th>일시</th><th>유형</th><th>내용</th><th>상태</th><th>비고</th></tr></thead><tbody>{actions.map((action, idx) => <tr key={idx}><td>{action.actionAt}</td><td>{action.actionType}</td><td className="text-left"><span className="table-text-wrap">{action.actionContent}</span></td><td><span className={`status-badge ${String(action.actionStatusAfter || "").toLowerCase()}`}>{issueStatusLabel("env", action.actionStatusAfter)}</span></td><td className="text-left"><span className="table-text-wrap">{action.resultNote || "-"}</span></td></tr>)}</tbody></table>}
        </div>
      )}

      {type === "quality" && (
        <div className="panel">
          <div className="panel-head"><h3>품질 검토 이력</h3><button className="secondary-button" onClick={() => setReviewModalOpen(true)}>검토 메모 등록</button></div>
          {reviews.length === 0 ? <p className="muted-text">등록된 품질 검토 이력이 없습니다.</p> : <table className="data-table issue-review-table"><colgroup><col className="col-date" /><col className="col-user" /><col className="col-content" /><col className="col-status" /></colgroup><thead><tr><th>검토일시</th><th>검토자</th><th>내용</th><th>상태</th></tr></thead><tbody>{reviews.map((review) => <tr key={review.qualityReviewId}><td>{review.reviewAt}</td><td>{review.reviewedByName || review.reviewedBy || "-"}</td><td className="text-left"><span className="table-text-wrap">{review.reviewContent}</span></td><td><span className={`status-badge ${String(review.reviewStatusAfter || "").toLowerCase()}`}>{issueStatusLabel("quality", review.reviewStatusAfter)}</span></td></tr>)}</tbody></table>}
        </div>
      )}

      <Modal
        open={type === "env" && actionModalOpen}
        title="환경 조치 메모 등록"
        description="환경 부적합 확인, 조치중, 조치완료 상태를 메모와 함께 남깁니다."
        onClose={resetActionForm}
        footer={<><button className="secondary-button" onClick={resetActionForm}>취소</button><button className="primary-button" onClick={saveAction}>DB 저장</button></>}
      >
        <div className="form-grid modal-form-grid single">
          <label className="wide-field">조치 내용<textarea value={actionContent} onChange={(e) => setActionContent(e.target.value)} placeholder="확인 내용 또는 조치 내용을 입력" /></label>
          <label>조치 후 상태<select value={actionStatusAfter} onChange={(e) => setActionStatusAfter(e.target.value)}><option value="ACKNOWLEDGED">확인</option><option value="IN_PROGRESS">조치중</option><option value="RESOLVED">조치완료</option></select></label>
        </div>
      </Modal>

      <Modal
        open={type === "quality" && reviewModalOpen}
        title="품질 검토 메모 등록"
        description="품질 부적합은 설비 조치보다 검토/분석/리포트 반영 흐름으로 관리합니다."
        onClose={resetReviewForm}
        footer={<><button className="secondary-button" onClick={resetReviewForm}>취소</button><button className="primary-button" onClick={saveReview}>DB 저장</button></>}
      >
        <div className="form-grid modal-form-grid single">
          <label className="wide-field">검토 내용<textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} placeholder="원인 분석, 품질 판단, 개선 의견을 입력" /></label>
          <label>검토 후 상태<select value={reviewStatusAfter} onChange={(e) => setReviewStatusAfter(e.target.value)}><option value="REVIEWED">검토완료</option><option value="REFLECTED">리포트반영</option></select></label>
        </div>
      </Modal>
    </div>
  );
}
