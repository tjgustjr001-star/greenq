import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { issueStatusLabel } from "../../data/displayLabels.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";

function normalizeType(value) { return String(value || "").toLowerCase() === "quality" ? "quality" : "env"; }

export default function IssueDetailPage() {
  const { issueType, issueId } = useParams();
  const navigate = useNavigate();
  const type = normalizeType(issueType);
  const [actionContent, setActionContent] = useState("");
  const [actionStatusAfter, setActionStatusAfter] = useState("IN_PROGRESS");
  const { data, loading, error, reload } = useApiData(async () => {
    const issue = await greenqApi.issue(`${type === "env" ? "ENV" : "QLT"}-${issueId}`);
    const actions = type === "env" ? await greenqApi.issueActions(issueId).catch(() => []) : [];
    return { issue: { ...issue, issueType: type }, actions };
  }, [type, issueId]);
  const issue = data?.issue;
  const actions = asArray(data?.actions);
  const saveAction = async () => {
    if (!actionContent.trim()) return;
    await greenqApi.createIssueAction(issueId, { actionContent, actionStatusAfter, actionType: "CHECKED" });
    setActionContent("");
    setActionStatusAfter("IN_PROGRESS");
    await reload();
  };
  const deleteIssue = async () => { if (!window.confirm("부적합 이력을 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteIssue(type, issueId); navigate("/issues"); };
  if (loading) return <div className="panel"><p className="muted-text">부적합 상세를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !issue) return <EmptyState title="부적합 이력을 찾을 수 없습니다." description={error || "잘못된 부적합 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/issues")}>부적합 목록으로</button>} />;
  return <div className="page"><PageHeader eyebrow="Nonconformity Detail" title={`${issue.zoneName} · ${issue.itemName}`} description="DB에 저장된 부적합 상세와 조치 이력을 확인합니다." actions={<><button className="secondary-button" onClick={() => navigate("/issues")}>목록으로</button><button className="danger-button" onClick={deleteIssue}>삭제</button></>} /><div className="panel detail-hero"><div><p className="eyebrow">{type === "env" ? "환경 부적합" : "품질 부적합"}</p><h3>{issue.batchName}</h3><p>{issue.occurredAt} · 기준 {issue.standardRange}</p></div><div className="inline-actions"><StatusBadge value={issue.severity} /><span className={`status-badge ${String(issue.status || "").toLowerCase()}`}>{issueStatusLabel(type, issue.status)}</span></div></div><section className="content-grid two"><div className="panel info-panel"><h3>부적합 정보</h3><dl><dt>측정값</dt><dd>{issue.measuredValue}</dd><dt>기준 최소</dt><dd>{issue.standardMin ?? "-"}</dd><dt>기준 최대</dt><dd>{issue.standardMax ?? "-"}</dd><dt>이탈률</dt><dd>{issue.deviationRate ?? "-"}</dd></dl></div><div className="panel info-panel"><h3>권장 조치</h3><p>{issue.guide || issue.guideMessage || "-"}</p></div></section>{type === "env" && <div className="panel fake-form"><h3>조치 이력 등록</h3><div className="form-grid"><label className="wide-field">조치 내용<input value={actionContent} onChange={(e) => setActionContent(e.target.value)} placeholder="확인 내용 또는 조치 내용을 입력" /></label><label>조치 후 상태<select value={actionStatusAfter} onChange={(e) => setActionStatusAfter(e.target.value)}><option value="IN_PROGRESS">조치중</option><option value="RESOLVED">조치완료</option></select></label></div><div className="form-footer-actions"><button className="primary-button" onClick={saveAction}>DB 저장</button></div></div>}<div className="panel"><div className="panel-head"><h3>조치 이력</h3></div>{actions.length === 0 ? <p className="muted-text">등록된 조치 이력이 없습니다.</p> : <table><thead><tr><th>일시</th><th>유형</th><th>내용</th><th>상태</th><th>비고</th></tr></thead><tbody>{actions.map((action, idx) => <tr key={idx}><td>{action.actionAt}</td><td>{action.actionType}</td><td>{action.actionContent}</td><td><span className={`status-badge ${String(action.actionStatusAfter || "").toLowerCase()}`}>{issueStatusLabel("env", action.actionStatusAfter)}</span></td><td>{action.resultNote || "-"}</td></tr>)}</tbody></table>}</div></div>;
}
