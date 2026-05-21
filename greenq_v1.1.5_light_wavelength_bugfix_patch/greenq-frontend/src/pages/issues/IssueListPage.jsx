import { useNavigate, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";

function normalizedType(value) { return String(value || "").toLowerCase() === "quality" ? "quality" : "env"; }
function rawId(issue) { return issue.rawId || String(issue.issueId || "").replace(/^(ENV|QLT)-/i, ""); }

export default function IssueListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type") || "all";
  const batchId = searchParams.get("batchId");
  const { data, loading, error, reload } = useApiData(() => greenqApi.issues(), []);
  const issueRows = asArray(data).map((i) => ({ ...i, issueType: normalizedType(i.issueType) }));
  const rows = issueRows.filter((issue) => (type === "all" || issue.issueType === type) && (!batchId || String(issue.batchId || "") === String(batchId)));
  const handleTab = (nextType) => setSearchParams(nextType === "all" ? {} : { type: nextType });
  const deleteIssue = async (issue) => { if (!window.confirm("부적합 이력을 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteIssue(issue.issueType, rawId(issue)); await reload(); };
  if (loading) return <div className="panel"><p className="muted-text">부적합 이력을 DB에서 불러오는 중입니다...</p></div>;
  return <div className="page"><PageHeader eyebrow="Nonconformity" title="부적합 이력" description="DB에 저장된 환경 부적합과 품질 부적합을 통합 조회합니다." />{error && <div className="notice-box">{error}</div>}<div className="tab-row"><button className={type === "all" ? "active" : ""} onClick={() => handleTab("all")}>전체</button><button className={type === "env" ? "active" : ""} onClick={() => handleTab("env")}>환경 부적합</button><button className={type === "quality" ? "active" : ""} onClick={() => handleTab("quality")}>품질 부적합</button></div><div className="panel"><table><thead><tr><th>발생일시</th><th>유형</th><th>구역</th><th>배치</th><th>항목</th><th>측정값</th><th>기준</th><th>심각도</th><th>상태</th><th>알림</th><th>관리</th></tr></thead><tbody>{rows.map((issue) => <tr key={`${issue.issueType}-${issue.issueId}`}><td>{issue.occurredAt}</td><td>{issue.issueType === "env" ? "환경" : "품질"}</td><td>{issue.zoneName}</td><td><button className="link-cell" onClick={() => navigate(`/issues/${issue.issueType}/${rawId(issue)}`)}><strong>{issue.batchName}</strong></button></td><td>{issue.itemName}</td><td>{issue.measuredValue}</td><td>{issue.standardRange}</td><td><StatusBadge value={issue.severity} /></td><td><StatusBadge value={issue.status} /></td><td>{issue.issueType === "env" ? `${issue.unreadAlertCount || 0}/${issue.activeAlertCount || 0}` : "-"}</td><td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/issues/${issue.issueType}/${rawId(issue)}`) }, { label: "삭제", kind: "delete", danger: true, onClick: () => deleteIssue(issue) }]} /></td></tr>)}</tbody></table></div></div>;
}
