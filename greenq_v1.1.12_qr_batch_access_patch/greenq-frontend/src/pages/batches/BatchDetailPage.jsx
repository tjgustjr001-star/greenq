import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import BatchQrModal from "../../components/BatchQrModal.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StatusSelect from "../../components/StatusSelect.jsx";
import { asArray, useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

const batchStatusOptions = [{ value: "PLANNED", label: "예정" }, { value: "GROWING", label: "재배 중" }, { value: "HARVESTED", label: "수확 완료" }, { value: "CLOSED", label: "종료" }];

export default function BatchDetailPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data, loading, error, reload } = useApiData(async () => {
    const [batch, crop, logs, issues, measurements] = await Promise.all([
      greenqApi.batch(batchId),
      greenqApi.batch(batchId).then((b) => greenqApi.crop(b.cropId)).catch(() => null),
      greenqApi.environmentLogs({ batchId }),
      greenqApi.issues(),
      greenqApi.measurements(),
    ]);
    return { batch, crop, logs, issues, measurements };
  }, [batchId]);
  const batch = data?.batch;
  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  if (loading) return <div className="panel"><p className="muted-text">배치 상세를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !batch) return <EmptyState title="배치를 찾을 수 없습니다." description={error || "잘못된 배치 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/zones")}>구역 목록으로</button>} />;

  const logs = asArray(data?.logs);
  const measurements = asArray(data?.measurements).filter((item) => String(item.batchId) === String(batchId));
  const issues = asArray(data?.issues).filter((issue) => issue.batchName === batch.batchName);
  const latestEnv = logs[0];
  const latestMeasurement = measurements[0];
  const form = editForm || { batchName: batch.batchName || "", plantedQuantity: batch.plantedQuantity || "", startDate: batch.startDate || "", expectedEndDate: batch.expectedEndDate || "", batchStatus: batch.batchStatus || "PLANNED" };

  const updateBatch = async (patch) => { await greenqApi.updateBatch(batchId, { ...batch, ...patch }); await reload(); };
  const deleteBatch = async () => { if (!window.confirm("배치를 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteBatch(batchId); navigate(`/zones/${batch.zoneId}`); };

  return <div className="page"><BatchQrModal open={isAdmin && qrOpen} batch={batch} onClose={() => setQrOpen(false)} onRegenerated={reload} /><PageHeader eyebrow="Batch Detail" title={batch.batchName} description="해당 배치의 재배 정보, 기준 연결, 최근 환경/품질 현황을 DB 기준으로 확인합니다." actions={<><button className="secondary-button" onClick={() => navigate(`/zones/${batch.zoneId}`)}>구역으로</button>{isAdmin && <button className="secondary-button" onClick={() => setQrOpen(true)}>QR 보기</button>}{isAdmin && <button className="secondary-button" onClick={() => { setEditOpen((p) => !p); setEditForm(form); }}>{editOpen ? "수정 닫기" : "배치 수정"}</button>}{isAdmin && <button className="danger-button" onClick={deleteBatch}>배치 삭제</button>}</>} /><div className="panel detail-hero"><div><p className="eyebrow">{batch.zoneName} · {batch.cropName}</p><h3>{batch.batchName}</h3><p>{batch.startDate} ~ {batch.expectedEndDate || "-"} · {batch.plantedQuantity}주</p></div><StatusSelect value={batch.batchStatus || "PLANNED"} options={batchStatusOptions} onChange={(nextStatus) => updateBatch({ batchStatus: nextStatus })} disabled={!isAdmin} label="배치 상태 변경" /></div>{!isAdmin && <div className="notice-box">작업자는 배치 상태를 조회만 할 수 있습니다.</div>}{isAdmin && editOpen && <div className="panel fake-form"><h3>배치 수정</h3><div className="form-grid"><label>배치명<input value={form.batchName} onChange={(e) => setEditForm((p) => ({ ...form, ...p, batchName: e.target.value }))} /></label><label>재배 수량<input value={form.plantedQuantity} onChange={(e) => setEditForm((p) => ({ ...form, ...p, plantedQuantity: e.target.value }))} /></label><label>시작일<input type="date" value={form.startDate} onChange={(e) => setEditForm((p) => ({ ...form, ...p, startDate: e.target.value }))} /></label><label>예정 종료일<input type="date" value={form.expectedEndDate} onChange={(e) => setEditForm((p) => ({ ...form, ...p, expectedEndDate: e.target.value }))} /></label></div><div className="form-footer-actions"><button className="secondary-button" onClick={() => setEditOpen(false)}>취소</button><button className="primary-button" onClick={async () => { await updateBatch({ ...form, plantedQuantity: Number(form.plantedQuantity || 0) }); setEditOpen(false); }}>수정 저장</button></div></div>}<section className="content-grid three"><div className="panel info-panel"><h3>배치 기본 정보</h3><dl><dt>작물</dt><dd>{batch.cropName}</dd><dt>구역</dt><dd>{batch.zoneName}</dd><dt>재배 수량</dt><dd>{batch.plantedQuantity}주</dd><dt>상태</dt><dd><StatusBadge value={batch.batchStatus} /></dd></dl></div><div className="panel info-panel"><h3>연결 기준 정보</h3><dl><dt>환경 기준</dt><dd>{data.crop?.envStandards?.length ?? 0}개 항목 사용</dd><dt>품질 기준</dt><dd>{data.crop?.qualityStandards?.length ?? 0}개 항목 사용</dd><dt>기준 작물</dt><dd>{data.crop?.cropName || batch.cropName} / {data.crop?.varietyName || "-"}</dd><dt>기준 관리</dt><dd><button className="small-button" onClick={() => navigate(`/crops/${batch.cropId}`)}>기준값 보기</button></dd></dl></div><div className="panel info-panel"><h3>운영 메모</h3><p className="large-text">현재 배치 기준으로 환경 로그, 실측 데이터, 부적합 이력을 확인하고 리포트 발급으로 이어질 수 있습니다.</p></div></section><section className="stat-grid three"><StatCard label="최근 환경" value={latestEnv?.envStatus || "없음"} hint={latestEnv?.measuredAt || "-"} /><StatCard label="최근 품질" value={latestMeasurement?.qualityStatus || "없음"} hint={latestMeasurement?.measuredAt || "-"} /><StatCard label="부적합 건수" value={issues.length} hint="환경/품질 통합" tone="red" /></section><section className="content-grid two"><div className="panel"><div className="panel-head"><h3>최근 환경 로그</h3><button className="text-button" onClick={() => navigate(`/environment?batchId=${batch.batchId}`)}>전체 로그 보기</button></div><table><thead><tr><th>측정시각</th><th>온도</th><th>습도</th><th>pH</th><th>상태</th></tr></thead><tbody>{logs.map((log) => <tr key={log.envLogId} onClick={() => navigate(`/environment/logs/${log.envLogId}`)}><td>{log.measuredAt}</td><td>{log.temperature}℃</td><td>{log.humidity}%</td><td>{log.ph}</td><td><StatusBadge value={log.envStatus} /></td></tr>)}</tbody></table></div><div className="panel"><div className="panel-head"><h3>실측/품질 이력</h3><button className="text-button" onClick={() => navigate(`/quality?batchId=${batch.batchId}`)}>실측 조회</button></div><table><thead><tr><th>측정일시</th><th>초장</th><th>생체중</th><th>품질</th></tr></thead><tbody>{measurements.map((item) => <tr key={item.measurementId} onClick={() => navigate(`/quality/${item.measurementId}`)}><td>{item.measuredAt}</td><td>{item.plantHeight}cm</td><td>{item.freshWeight}g</td><td><StatusBadge value={item.qualityStatus} /></td></tr>)}</tbody></table></div></section><section className="quick-actions"><button onClick={() => navigate(`/environment?batchId=${batch.batchId}`)}>환경 로그 보기</button><button onClick={() => navigate(`/quality/new?batchId=${batch.batchId}`)}>실측 입력</button><button onClick={() => navigate(`/issues?batchId=${batch.batchId}`)}>부적합 보기</button><button onClick={() => navigate(`/reports?batchId=${batch.batchId}`)}>리포트 발급</button></section></div>;
}
