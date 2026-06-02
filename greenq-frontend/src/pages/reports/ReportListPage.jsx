import { FileText, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import ActionMenu from "../../components/ActionMenu.jsx";
import Drawer from "../../components/Drawer.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { labelOf } from "../../data/displayLabels.js";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const today = () => new Date().toISOString().slice(0, 10);

const reportTypes = [
  { value: "DAILY", label: "일일" },
  { value: "WEEKLY", label: "주간" },
  { value: "MONTHLY", label: "월간" },
  { value: "QUARTERLY", label: "분기" },
  { value: "YEARLY", label: "연간" },
];

const reportScopes = [
  { value: "BATCH", label: "배치" },
  { value: "ZONE", label: "구역" },
  { value: "CROP", label: "작물" },
  { value: "ALL", label: "전체" },
];

function addDays(base, days) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function defaultStartDate(type, endDate = today()) {
  if (type === "WEEKLY") return addDays(endDate, -6);
  if (type === "MONTHLY") return addDays(endDate, -29);
  if (type === "QUARTERLY") return addDays(endDate, -89);
  if (type === "YEARLY") return addDays(endDate, -364);
  return endDate;
}

function targetNameFor(form, batches, zones, crops) {
  if (form.reportScope === "BATCH") return batches.find((item) => String(item.batchId) === String(form.batchId))?.batchName || "선택 배치";
  if (form.reportScope === "ZONE") return zones.find((item) => String(item.zoneId) === String(form.zoneId))?.zoneName || "선택 구역";
  if (form.reportScope === "CROP") return crops.find((item) => String(item.cropId) === String(form.cropId))?.cropName || "선택 작물";
  return "전체";
}

function makeReportTitle(form, batches, zones, crops) {
  const target = targetNameFor(form, batches, zones, crops);
  const type = reportTypes.find((item) => item.value === form.reportType)?.label || form.reportType;
  const range = form.startDate === form.endDate ? form.endDate : `${form.startDate}~${form.endDate}`;
  return `${target} ${type} 리포트 - ${range}`;
}

function hasRequiredTarget(form) {
  if (form.reportScope === "BATCH") return Boolean(form.batchId);
  if (form.reportScope === "ZONE") return Boolean(form.zoneId);
  if (form.reportScope === "CROP") return Boolean(form.cropId);
  return true;
}

export default function ReportListPage() {
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batchId");
  const { data, loading, error, reload } = useApiData(async () => {
    const [batches, zones, crops, reports] = await Promise.all([
      greenqApi.batches(),
      greenqApi.zones(),
      greenqApi.crops(),
      greenqApi.reports(),
    ]);
    return { batches, zones, crops, reports };
  }, []);
  const batches = asArray(data?.batches);
  const zones = asArray(data?.zones);
  const crops = asArray(data?.crops);
  const reports = asArray(data?.reports);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    reportType: "DAILY",
    reportScope: batchId ? "BATCH" : "ALL",
    batchId: batchId || "",
    zoneId: "",
    cropId: "",
    startDate: today(),
    endDate: today(),
  });

  useEffect(() => {
    if (form.reportScope !== "BATCH") return;
    if (!form.batchId && batches[0]) setForm((prev) => ({ ...prev, batchId: String(batches[0].batchId) }));
  }, [batches, form.reportScope, form.batchId]);

  useEffect(() => {
    if (form.reportScope !== "ZONE") return;
    if (!form.zoneId && zones[0]) setForm((prev) => ({ ...prev, zoneId: String(zones[0].zoneId) }));
  }, [zones, form.reportScope, form.zoneId]);

  useEffect(() => {
    if (form.reportScope !== "CROP") return;
    if (!form.cropId && crops[0]) setForm((prev) => ({ ...prev, cropId: String(crops[0].cropId) }));
  }, [crops, form.reportScope, form.cropId]);

  const issueTitle = useMemo(() => makeReportTitle(form, batches, zones, crops), [form, batches, zones, crops]);
  const validTarget = hasRequiredTarget(form);

  const openDrawer = () => {
    setForm((prev) => ({
      ...prev,
      reportScope: batchId ? "BATCH" : prev.reportScope,
      batchId: batchId || prev.batchId,
    }));
    setDrawerOpen(true);
  };

  const changeType = (reportType) => {
    setForm((prev) => ({
      ...prev,
      reportType,
      startDate: defaultStartDate(reportType, prev.endDate),
    }));
  };

  const changeScope = (reportScope) => {
    setForm((prev) => ({
      ...prev,
      reportScope,
      batchId: reportScope === "BATCH" ? prev.batchId || String(batches[0]?.batchId || "") : "",
      zoneId: reportScope === "ZONE" ? prev.zoneId || String(zones[0]?.zoneId || "") : "",
      cropId: reportScope === "CROP" ? prev.cropId || String(crops[0]?.cropId || "") : "",
    }));
  };

  const issueReport = async () => {
    if (!validTarget || saving) return;
    setSaving(true);
    try {
      const created = await greenqApi.createReport({
        reportTitle: issueTitle,
        reportType: form.reportType,
        reportScope: form.reportScope,
        batchId: form.reportScope === "BATCH" ? form.batchId : null,
        zoneId: form.reportScope === "ZONE" ? form.zoneId : null,
        cropId: form.reportScope === "CROP" ? form.cropId : null,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setDrawerOpen(false);
      await reload();
      const reportId = created?.reportId;
      if (reportId) navigate(`/reports/${reportId}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (report) => {
    if (!window.confirm("리포트를 DB에서 임시 삭제 처리합니다.")) return;
    await greenqApi.deleteReport(report.reportId);
    await reload();
  };

  if (loading) return <div className="panel"><p className="muted-text">리포트를 DB에서 불러오는 중입니다...</p></div>;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Report"
        title="리포트"
        description="기간·구역·작물·배치 조건을 기준으로 환경/품질/부적합 요약을 자동 집계합니다."
        actions={<button className="primary-button" onClick={openDrawer}><Plus size={16} />리포트 발급</button>}
      />

      {error && <div className="notice-box">{error}</div>}
      {batchId && <div className="notice-box">현재 batchId={batchId} 기준 리포트 발급 진입 URL입니다.</div>}

      <div className="report-summary-strip">
        <div className="report-summary-card"><span>총 리포트</span><strong>{reports.length}</strong></div>
        <div className="report-summary-card"><span>재발급 리포트</span><strong>{reports.filter((item) => Number(item.reportVersion || 1) > 1).length}</strong></div>
        <div className="report-summary-card"><span>최근 발급</span><strong>{reports[0]?.createdAt || "-"}</strong></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>리포트 목록</h3>
          <p>리포트 원본은 수정하지 않고, 같은 조건으로 다시 발급하면 버전이 증가합니다.</p>
        </div>
        <table className="report-list-table">
          <thead>
            <tr><th>리포트명</th><th>유형</th><th>범위</th><th>대상</th><th>기간</th><th>버전</th><th>상태</th><th>발급일</th><th>관리</th></tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.reportId}>
                <td><button className="link-cell" onClick={() => navigate(`/reports/${report.reportId}`)}><strong>{report.reportTitle}</strong></button></td>
                <td><StatusBadge value={report.reportType} /></td>
                <td>{labelOf(report.reportScope)}</td>
                <td>{report.targetName}</td>
                <td>{report.startDate} ~ {report.endDate}</td>
                <td>v{report.reportVersion || 1}</td>
                <td><StatusBadge value={report.reportStatus} /></td>
                <td>{report.createdAt}</td>
                <td><ActionMenu items={[{ label: "상세 보기", kind: "detail", onClick: () => navigate(`/reports/${report.reportId}`) }, isAdmin && { label: "삭제", kind: "delete", danger: true, onClick: () => deleteReport(report) }]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={drawerOpen}
        title="리포트 발급 조건"
        description="선택한 조건으로 환경 요약, 품질 요약, 부적합 요약, 관리 가이드를 자동 생성합니다."
        onClose={() => setDrawerOpen(false)}
        footer={
          <>
            <button className="secondary-button" onClick={() => setDrawerOpen(false)} disabled={saving}>취소</button>
            <button className="primary-button" onClick={issueReport} disabled={!validTarget || saving}>{saving ? "발급 중..." : "자동 집계 발급"}</button>
          </>
        }
      >
        <div className="drawer-form-grid single">
          <label>리포트 유형
            <select value={form.reportType} onChange={(e) => changeType(e.target.value)}>
              {reportTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label>리포트 범위
            <select value={form.reportScope} onChange={(e) => changeScope(e.target.value)}>
              {reportScopes.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
            </select>
          </label>

          {form.reportScope === "BATCH" && <label>대상 배치
            <select value={form.batchId} onChange={(e) => setForm((prev) => ({ ...prev, batchId: e.target.value }))}>
              {batches.map((batch) => <option key={batch.batchId} value={batch.batchId}>{batch.batchName}</option>)}
            </select>
          </label>}
          {form.reportScope === "ZONE" && <label>대상 구역
            <select value={form.zoneId} onChange={(e) => setForm((prev) => ({ ...prev, zoneId: e.target.value }))}>
              {zones.map((zone) => <option key={zone.zoneId} value={zone.zoneId}>{zone.zoneName}</option>)}
            </select>
          </label>}
          {form.reportScope === "CROP" && <label>대상 작물
            <select value={form.cropId} onChange={(e) => setForm((prev) => ({ ...prev, cropId: e.target.value }))}>
              {crops.map((crop) => <option key={crop.cropId} value={crop.cropId}>{crop.cropName}</option>)}
            </select>
          </label>}

          <label>시작일
            <input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
          </label>
          <label>종료일
            <input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value, startDate: defaultStartDate(prev.reportType, e.target.value) }))} />
          </label>
        </div>

        <div className="report-condition-preview">
          <div className="preview-icon"><FileText size={18} /></div>
          <div>
            <strong>{issueTitle}</strong>
            <p>{labelOf(form.reportScope)} 범위 · {form.startDate} ~ {form.endDate} 데이터를 기준으로 자동 집계합니다.</p>
            {!validTarget && <p className="danger-text">발급 대상을 선택해야 합니다.</p>}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
