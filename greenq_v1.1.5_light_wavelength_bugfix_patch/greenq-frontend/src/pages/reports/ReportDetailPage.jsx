import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { labelOf } from "../../data/displayLabels.js";
import { useApiData } from "../../hooks/useApiData.js";

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { data: report, loading, error } = useApiData(() => greenqApi.report(reportId), [reportId]);
  const deleteReport = async () => { if (!window.confirm("리포트를 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteReport(reportId); navigate("/reports"); };
  if (loading) return <div className="panel"><p className="muted-text">리포트를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !report) return <EmptyState title="리포트를 찾을 수 없습니다." description={error || "잘못된 리포트 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/reports")}>리포트 목록으로</button>} />;
  return <div className="page"><PageHeader eyebrow="Report Detail" title={report.reportTitle} description="DB에 저장된 리포트 상세 내용을 확인합니다." actions={<><button className="secondary-button" onClick={() => navigate("/reports")}>목록으로</button><button className="danger-button" onClick={deleteReport}>삭제</button></>} /><div className="panel detail-hero"><div><p className="eyebrow">{labelOf(report.reportType)} · {labelOf(report.reportScope)}</p><h3>{report.targetName}</h3><p>{report.startDate} ~ {report.endDate} · {report.createdAt}</p></div><StatusBadge value={report.reportStatus} /></div><section className="content-grid two"><div className="panel info-panel"><h3>환경 요약</h3><p>{report.envSummary || "-"}</p></div><div className="panel info-panel"><h3>품질 요약</h3><p>{report.qualitySummary || "-"}</p></div><div className="panel info-panel"><h3>환경 부적합 요약</h3><p>{report.envNcSummary || "-"}</p></div><div className="panel info-panel"><h3>품질 부적합 요약</h3><p>{report.qualityNcSummary || "-"}</p></div></section><div className="panel"><h3>운영 가이드</h3><p>{report.guideSummary || "-"}</p></div></div>;
}
