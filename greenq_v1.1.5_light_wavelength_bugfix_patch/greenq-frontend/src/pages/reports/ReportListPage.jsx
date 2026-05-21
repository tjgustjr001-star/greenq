import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { labelOf } from "../../data/displayLabels.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";

const today = () => new Date().toISOString().slice(0, 10);

export default function ReportListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batchId");
  const { data, loading, error, reload } = useApiData(async () => {
    const [batches, reports] = await Promise.all([greenqApi.batches(), greenqApi.reports()]);
    return { batches, reports };
  }, []);
  const batches = asArray(data?.batches);
  const reports = asArray(data?.reports);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reportType: "DAILY", reportScope: "BATCH", batchId: batchId || "", startDate: today(), endDate: today() });
  useEffect(() => { if (!form.batchId && batches[0]) setForm((p) => ({ ...p, batchId: String(batches[0].batchId) })); }, [batches, form.batchId]);
  const issueReport = async () => { const targetBatch = batches.find((b) => String(b.batchId) === String(form.batchId)); await greenqApi.createReport({ reportTitle: `${form.reportScope === "BATCH" ? targetBatch?.batchName || "선택 배치" : "전체"} ${form.reportType} 리포트`, ...form, batchId: form.reportScope === "BATCH" ? form.batchId : null, envSummary: "선택 기간의 환경 로그를 요약합니다.", qualitySummary: "선택 기간의 품질 실측 결과를 요약합니다.", guideSummary: "환경/품질 이력을 바탕으로 운영 가이드를 제공합니다." }); setShowForm(false); await reload(); };
  const deleteReport = async (report) => { if (!window.confirm("리포트를 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteReport(report.reportId); await reload(); };
  if (loading) return <div className="panel"><p className="muted-text">리포트를 DB에서 불러오는 중입니다...</p></div>;
  return <div className="page"><PageHeader eyebrow="Report" title="리포트" description="DB에 발급된 리포트 목록을 조회하고 새 리포트를 발급합니다." actions={<button className="primary-button" onClick={() => setShowForm((p) => !p)}><Plus size={16} />{showForm ? "발급 닫기" : "리포트 발급"}</button>} />{error && <div className="notice-box">{error}</div>}{batchId && <div className="notice-box">현재 batchId={batchId} 기준 리포트 발급 진입 URL입니다.</div>}{showForm && <div className="panel fake-form"><h3>리포트 발급</h3><div className="form-grid"><label>리포트 유형<select value={form.reportType} onChange={(e) => setForm((p) => ({ ...p, reportType: e.target.value }))}><option value="DAILY">일일</option><option value="WEEKLY">주간</option><option value="MONTHLY">월간</option><option value="QUARTERLY">분기</option><option value="YEARLY">연간</option></select></label><label>리포트 범위<select value={form.reportScope} onChange={(e) => setForm((p) => ({ ...p, reportScope: e.target.value }))}><option value="BATCH">배치</option><option value="ALL">전체</option></select></label><label>대상 배치<select value={form.batchId} onChange={(e) => setForm((p) => ({ ...p, batchId: e.target.value }))} disabled={form.reportScope !== "BATCH"}>{batches.map((batch) => <option key={batch.batchId} value={batch.batchId}>{batch.batchName}</option>)}</select></label><label>시작일<input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></label><label>종료일<input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} /></label></div><div className="form-footer-actions"><button className="secondary-button" onClick={() => setShowForm(false)}>취소</button><button className="primary-button" onClick={issueReport}>DB 발급</button></div></div>}<div className="panel"><div className="panel-head"><h3>리포트 목록</h3></div><table><thead><tr><th>리포트명</th><th>유형</th><th>범위</th><th>대상</th><th>기간</th><th>발급일</th><th>관리</th></tr></thead><tbody>{reports.map((report) => <tr key={report.reportId}><td><button className="link-cell" onClick={() => navigate(`/reports/${report.reportId}`)}><strong>{report.reportTitle}</strong></button></td><td><StatusBadge value={report.reportType} /></td><td>{labelOf(report.reportScope)}</td><td>{report.targetName}</td><td>{report.startDate} ~ {report.endDate}</td><td>{report.createdAt}</td><td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/reports/${report.reportId}`) }, { label: "삭제", kind: "delete", danger: true, onClick: () => deleteReport(report) }]} /></td></tr>)}</tbody></table></div></div>;
}
