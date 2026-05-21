import { useNavigate, useParams } from "react-router-dom";
import { greenqApi } from "../../api/greenqApi.js";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { useApiData } from "../../hooks/useApiData.js";
import { getCurrentUser } from "../../utils/auth.js";

export default function EnvironmentLogDetailPage() {
  const { envLogId } = useParams();
  const navigate = useNavigate();
  const isAdmin = (getCurrentUser().role || getCurrentUser().roleCode) === "ADMIN";
  const { data: log, loading, error } = useApiData(() => greenqApi.environmentLog(envLogId), [envLogId]);
  const deleteLog = async () => { if (!window.confirm("환경 데이터를 DB에서 임시 삭제 처리합니다.")) return; await greenqApi.deleteEnvironmentLog(envLogId); navigate("/environment"); };
  if (loading) return <div className="panel"><p className="muted-text">환경 로그를 DB에서 불러오는 중입니다...</p></div>;
  if (error || !log) return <EmptyState title="환경 로그를 찾을 수 없습니다." description={error || "잘못된 환경 로그 ID입니다."} action={<button className="primary-button" onClick={() => navigate("/environment")}>환경 목록으로</button>} />;
  return <div className="page"><PageHeader eyebrow="Environment Log" title={`${log.batchName} 환경 로그`} description="DB에 저장된 환경 로그와 항목별 판정 결과를 확인합니다." actions={<><button className="secondary-button" onClick={() => navigate("/environment")}>목록으로</button>{isAdmin && <button className="danger-button" onClick={deleteLog}>삭제</button>}</>} /><div className="panel detail-hero"><div><p className="eyebrow">{log.zoneName} · {log.batchName}</p><h3>{log.measuredAt}</h3><p>데이터 출처: {log.dataSource || "-"}</p></div><StatusBadge value={log.envStatus} /></div><section className="content-grid three"><div className="panel info-panel"><h3>공기환경</h3><dl><dt>온도</dt><dd>{log.temperature}℃</dd><dt>습도</dt><dd>{log.humidity}%</dd><dt>CO2</dt><dd>{log.co2 ?? "-"}</dd><dt>VPD</dt><dd>{log.vpd ?? "-"}</dd></dl></div><div className="panel info-panel"><h3>양액환경</h3><dl><dt>pH</dt><dd>{log.ph}</dd><dt>EC</dt><dd>{log.ec}</dd><dt>수온</dt><dd>{log.waterTemp ?? "-"}</dd></dl></div><div className="panel info-panel"><h3>광환경</h3><dl><dt>광량</dt><dd>{log.lightIntensity ?? "-"}</dd><dt>광주기</dt><dd>{log.photoperiod ?? "-"}</dd><dt>파장</dt><dd>{log.lightWavelength || "-"}</dd></dl></div></section><div className="panel"><div className="panel-head"><h3>항목별 판정</h3></div><table><thead><tr><th>항목</th><th>측정값</th><th>기준</th><th>이탈률</th><th>상태</th><th>가이드</th></tr></thead><tbody>{(log.items || []).map((item) => <tr key={item.envEvalItemId || item.itemCode || item.itemName}><td><strong>{item.itemName}</strong></td><td>{item.measuredValue}</td><td>{item.standard || item.standardRange}</td><td>{item.deviationRate ?? "-"}</td><td><StatusBadge value={item.status || item.evalStatus} /></td><td>{item.guide || item.guideMessage || "-"}</td></tr>)}</tbody></table></div></div>;
}
