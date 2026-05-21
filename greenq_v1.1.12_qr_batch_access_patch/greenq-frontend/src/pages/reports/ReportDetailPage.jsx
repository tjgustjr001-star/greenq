import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { labelOf } from "../../data/displayLabels.js";
import { useApiData } from "../../hooks/useApiData.js";

function parseCondition(json) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function SummaryPanel({ title, children }) {
  return <div className="panel info-panel report-info-panel"><h3>{title}</h3><p>{children || "-"}</p></div>;
}

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { data: report, loading, error } = useApiData(() => greenqApi.report(reportId), [reportId]);
  const condition = useMemo(() => parseCondition(report?.generatedConditionJson), [report]);
  const deleteReport = async () => {
    if (!window.confirm("리포트를 DB에서 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteReport(reportId);
    navigate("/reports");
  };

  if (loading) return <div className="panel"><p className="muted-text">리포트를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !report) return <EmptyState title="리포트를 찾을 수 없습니다." description={error || "잘못된 리포트 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/reports")}>리포트 목록으로</button>} />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Report Detail"
        title={report.reportTitle}
        description="발급 당시 조건으로 자동 집계되어 저장된 리포트 스냅샷입니다."
        actions={<><button className="secondary-button" onClick={() => navigate("/reports")}>목록으로</button><button className="danger-button" onClick={deleteReport}>삭제</button></>}
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

      <section className="content-grid two">
        <SummaryPanel title="환경 요약">{report.envSummary}</SummaryPanel>
        <SummaryPanel title="품질 요약">{report.qualitySummary}</SummaryPanel>
        <SummaryPanel title="환경 부적합 요약">{report.envNcSummary}</SummaryPanel>
        <SummaryPanel title="품질 부적합 요약">{report.qualityNcSummary}</SummaryPanel>
      </section>

      <div className="panel report-guide-panel">
        <h3>관리 가이드</h3>
        <p>{report.guideSummary || "-"}</p>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>발급 조건 스냅샷</h3><p>리포트 발급 당시 필터와 주요 집계값입니다.</p></div>
        <div className="report-condition-grid">
          <div><span>리포트 유형</span><strong>{labelOf(condition?.reportType || report.reportType)}</strong></div>
          <div><span>범위</span><strong>{labelOf(condition?.reportScope || report.reportScope)}</strong></div>
          <div><span>대상</span><strong>{condition?.targetName || report.targetName}</strong></div>
          <div><span>기간</span><strong>{report.startDate} ~ {report.endDate}</strong></div>
          <div><span>평균 온도</span><strong>{condition?.envAvgTemp || "-"}℃</strong></div>
          <div><span>평균 습도</span><strong>{condition?.envAvgHumidity || "-"}%</strong></div>
          <div><span>평균 pH</span><strong>{condition?.envAvgPh || "-"}</strong></div>
          <div><span>평균 EC</span><strong>{condition?.envAvgEc || "-"}</strong></div>
        </div>
      </div>
    </div>
  );
}
