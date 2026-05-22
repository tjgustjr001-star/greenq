import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { issueStatusLabel, labelOf } from "../../data/displayLabels.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

function fmtValue(value, unit = "") {
  if (value === null || value === undefined || value === "") return "-";
  return `${value}${unit || ""}`;
}

export default function QualityDetailPage() {
  const { measurementId } = useParams();
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data: measurement, loading, error } = useApiData(() => greenqApi.measurement(measurementId), [measurementId]);
  const deleteMeasurement = async () => {
    if (!window.confirm("실측 데이터를 DB에서 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteMeasurement(measurementId);
    navigate("/quality");
  };

  if (loading) return <div className="panel"><p className="muted-text">실측 상세를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !measurement) return <EmptyState title="실측 데이터를 찾을 수 없습니다." description={error || "잘못된 실측 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/quality")}>실측 목록으로</button>} />;

  const items = asArray(measurement.items);
  const samples = asArray(measurement.samples);
  const qualityIssues = asArray(measurement.qualityIssues);
  const reviews = asArray(measurement.reviews);
  const reflected = String(measurement.reportReflectedYn || "N").toUpperCase() === "Y";

  return (
    <div className="page">
      <PageHeader
        eyebrow="Quality Detail"
        title={`${measurement.batchName} 실측 상세`}
        description="실측 원본, 자동 품질 평가 결과, 품질 부적합과 검토/리포트 반영 상태를 확인합니다."
        actions={<><button className="secondary-button" onClick={() => navigate("/quality")}>목록으로</button><button className="secondary-button" onClick={() => navigate(`/quality/new?batchId=${measurement.batchId}`)}>같은 배치 입력</button>{isAdmin && <button className="danger-button" onClick={deleteMeasurement}>삭제</button>}</>}
      />

      <div className="panel detail-hero">
        <div><p className="eyebrow">{measurement.zoneName} · {measurement.cropName}</p><h3>{measurement.measuredAt}</h3><p>샘플 {measurement.sampleCount}건 · 입력자 {measurement.measuredByName || measurement.measuredBy || "-"} · {measurement.specialNote || "특이사항 없음"}</p></div>
        <div className="badge-stack"><StatusBadge value={measurement.qualityStatus} /><span className={`status-badge ${reflected ? "reflected" : "recorded"}`}>{reflected ? "리포트 반영" : "리포트 미반영"}</span></div>
      </div>

      <section className="stat-grid five compact">
        <div className="stat-card"><p>정상</p><strong>{measurement.normalItemCount ?? 0}</strong><span>평가 항목</span></div>
        <div className="stat-card orange"><p>주의</p><strong>{measurement.cautionItemCount ?? 0}</strong><span>평가 항목</span></div>
        <div className="stat-card red"><p>경고</p><strong>{measurement.failItemCount ?? 0}</strong><span>평가 항목</span></div>
        <div className="stat-card"><p>누락</p><strong>{measurement.missingItemCount ?? 0}</strong><span>평가 항목</span></div>
        <div className="stat-card blue"><p>부적합</p><strong>{qualityIssues.length}</strong><span>품질 이슈</span></div>
      </section>

      {measurement.summaryMessage && <div className="notice-box">{measurement.summaryMessage}</div>}

      <section className="content-grid two quality-detail-summary-grid">
        <div className="panel info-panel quality-summary-panel"><div className="panel-head"><h3>평균 실측값</h3></div><dl><dt>초장</dt><dd>{fmtValue(measurement.plantHeight, "cm")}</dd><dt>엽폭</dt><dd>{fmtValue(measurement.leafWidth, "cm")}</dd><dt>엽장</dt><dd>{fmtValue(measurement.leafLength, "cm")}</dd><dt>생체중</dt><dd>{fmtValue(measurement.freshWeight, "g")}</dd><dt>엽색</dt><dd>{measurement.leafColor || "-"}</dd><dt>생육단계</dt><dd>{measurement.growthStage || "-"}</dd></dl></div>
        <div className="panel info-panel quality-summary-panel"><div className="panel-head"><h3>품질 평가 기준 연결</h3></div><dl><dt>품질 평가 ID</dt><dd>{measurement.qualityEvalId || "-"}</dd><dt>평가 상태</dt><dd><StatusBadge value={measurement.overallStatus || measurement.qualityStatus} /></dd><dt>리포트 반영</dt><dd>{reflected ? "반영 완료" : "검토 후 반영 필요"}</dd><dt>검토 이력</dt><dd>{reviews.length}건</dd></dl></div>
      </section>

      <div className="panel table-panel quality-evaluation-table-panel"><div className="panel-head"><h3>품질 판정 항목</h3></div><table className="data-table quality-evaluation-table"><colgroup><col className="col-item" /><col className="col-value" /><col className="col-standard" /><col className="col-small" /><col className="col-small" /><col className="col-status" /></colgroup><thead><tr><th>항목</th><th>측정값</th><th>기준</th><th>이탈값</th><th>이탈률</th><th>상태</th></tr></thead><tbody>{items.map((item) => <tr key={item.qualityEvalItemId || item.itemCode}><td className="text-left"><strong>{item.itemName}</strong></td><td>{fmtValue(item.measuredValue ?? item.measuredTextValue, item.unit)}</td><td className="text-left"><span className="table-text-wrap">{item.expectedTextValue ? `기대값: ${item.expectedTextValue}` : item.standard}</span></td><td>{item.deviationValue ?? "-"}</td><td>{item.deviationRate === null || item.deviationRate === undefined ? "-" : `${item.deviationRate}%`}</td><td><StatusBadge value={item.status || item.evalStatus} /></td></tr>)}</tbody></table></div>

      <div className="panel table-panel"><div className="panel-head"><h3>품질 부적합</h3><button className="secondary-button" onClick={() => navigate("/issues?type=quality")}>품질 부적합 목록</button></div>{qualityIssues.length === 0 ? <p className="muted-text">등록된 품질 부적합이 없습니다.</p> : <table className="data-table quality-issue-table"><colgroup><col className="col-item" /><col className="col-value" /><col className="col-standard" /><col className="col-status" /><col className="col-status" /><col className="col-status" /><col className="col-action" /></colgroup><thead><tr><th>항목</th><th>측정값</th><th>기준</th><th>심각도</th><th>검토 상태</th><th>리포트 반영</th><th>관리</th></tr></thead><tbody>{qualityIssues.map((issue) => <tr key={issue.qualityNcId}><td className="text-left"><strong>{issue.itemName}</strong></td><td>{issue.measuredValueDisplay ?? issue.measuredTextValue ?? issue.measuredValue ?? "-"}</td><td className="text-left"><span className="table-text-wrap">{issue.standardRange}</span></td><td><StatusBadge value={issue.severity} /></td><td>{issueStatusLabel("quality", issue.status || issue.qualityNcStatus)}</td><td>{String(issue.reportReflectedYn).toUpperCase() === "Y" ? "반영" : "미반영"}</td><td><button className="small-button" onClick={() => navigate(`/issues/quality/${issue.rawId}`)}>상세</button></td></tr>)}</tbody></table>}</div>

      <div className="panel table-panel"><div className="panel-head"><h3>품질 검토 이력</h3></div>{reviews.length === 0 ? <p className="muted-text">등록된 품질 검토 이력이 없습니다. 품질 부적합 상세에서 검토 메모를 등록할 수 있습니다.</p> : <table className="data-table review-table"><colgroup><col className="col-date" /><col className="col-user" /><col className="col-content" /><col className="col-status" /><col className="col-status" /></colgroup><thead><tr><th>검토일시</th><th>검토자</th><th>내용</th><th>상태</th><th>리포트</th></tr></thead><tbody>{reviews.map((review) => <tr key={review.qualityReviewId}><td>{review.reviewAt}</td><td>{review.reviewedByName || review.reviewedBy || "-"}</td><td className="text-left"><span className="table-text-wrap">{review.reviewContent}</span></td><td>{issueStatusLabel("quality", review.reviewStatusAfter)}</td><td>{String(review.reportReflectedYn).toUpperCase() === "Y" ? "반영" : "미반영"}</td></tr>)}</tbody></table>}</div>

      <div className="panel table-panel"><div className="panel-head"><h3>샘플 원본</h3></div><table className="data-table sample-table"><colgroup><col className="col-small" /><col className="col-value" /><col className="col-value" /><col className="col-value" /><col className="col-value" /><col className="col-value" /><col className="col-status" /><col className="col-content" /></colgroup><thead><tr><th>No</th><th>초장</th><th>엽폭</th><th>엽장</th><th>생체중</th><th>엽색</th><th>생육단계</th><th>메모</th></tr></thead><tbody>{samples.map((sample) => <tr key={sample.sampleNo}><td>{sample.sampleNo}</td><td>{sample.plantHeight}</td><td>{sample.leafWidth}</td><td>{sample.leafLength}</td><td>{sample.freshWeight}</td><td>{sample.leafColor}</td><td>{labelOf(sample.growthStage)}</td><td className="text-left"><span className="table-text-wrap">{sample.specialNote || sample.note || "-"}</span></td></tr>)}</tbody></table></div>
    </div>
  );
}
